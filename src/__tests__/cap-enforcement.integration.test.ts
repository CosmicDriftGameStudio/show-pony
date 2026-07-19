// Cap-enforcement over real HTTP (not a direct ctx.systemWriteAs dispatch)
// on the free tier's two hard caps — proves the wire-level contract
// (422 + the specific error code), not just that checkStockCap runs.
//
// event:create's maxEvents cap is exercised at ctx-level already in
// demo-seed-tier-and-rsvp-access.integration.test.ts; this file adds the
// HTTP-level 422 assertion plus the rsvp:submit maxGuests cap, which had no
// coverage anywhere.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  configValuesTable,
  createConfigAccessorFactory,
  createConfigFeature,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { mailTransportInMemoryFeature } from "@cosmicdrift/kumiko-bundled-features/mail-transport-inmemory";
import { createManagedPagesFeature } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { tenantEntity } from "@cosmicdrift/kumiko-bundled-features/tenant";
import { seedTenant } from "@cosmicdrift/kumiko-bundled-features/tenant/seeding";
import { createEventsTable } from "@cosmicdrift/kumiko-framework/event-store";
import {
  setupTestStack,
  type TestStack,
  TestUsers,
  testTenantId,
  unsafeCreateEntityTable,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import { eventEntity, rsvpEntity, showPonyFeature } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { TIER_MAX_GUESTS } from "../marketing/pricing";

let stack: TestStack;
const TENANT_ID = testTenantId(1);
const GUEST_CAP_TENANT_ID = testTenantId(2);
const host = { ...TestUsers.admin, tenantId: TENANT_ID };
const guestCapHost = { ...TestUsers.admin, tenantId: GUEST_CAP_TENANT_ID };

// Same appOverride as bin/server.ts — mail-foundation needs a selected
// provider or createTransportForTenant throws "no provider selected".
const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

const managedPages = createManagedPagesFeature({ resolveApexTenant: async () => null });

beforeAll(async () => {
  stack = await setupTestStack({
    features: [
      createConfigFeature(),
      managedPages,
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    extraContext: ({ registry }) => ({
      configResolver,
      _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    }),
  });
  await unsafeCreateEntityTable(stack.db, tenantEntity);
  await unsafeCreateEntityTable(stack.db, eventEntity, "event");
  await unsafeCreateEntityTable(stack.db, rsvpEntity, "rsvp");
  await unsafePushTables(stack.db, {
    tier_assignments: tierAssignmentTable,
    config_values: configValuesTable,
  });
  await createEventsTable(stack.db);
  await seedTenant(stack.db, { id: TENANT_ID, key: "capcheck", name: "Cap Check" });
  await seedTenant(stack.db, {
    id: GUEST_CAP_TENANT_ID,
    key: "capcheck-guests",
    name: "Guest Cap Check",
  });
});

afterAll(async () => stack?.cleanup());

describe("free-tier hard caps → 422 over HTTP (no tier grant)", () => {
  test("event:create over maxEvents (free=1) → 422 upgrade_required", async () => {
    const first = await stack.http.writeOk<{ id: string }>(
      "showpony:write:event:create",
      { title: "First", slug: "first-event", startsAt: "2026-09-12T19:00:00.000Z", guestLimit: 10 },
      host,
    );
    expect(first.id).toBeTruthy();

    const err = await stack.http.writeErr(
      "showpony:write:event:create",
      {
        title: "Second",
        slug: "second-event",
        startsAt: "2026-09-13T19:00:00.000Z",
        guestLimit: 10,
      },
      host,
    );
    expect(err.httpStatus).toBe(422);
    expect(err.code).toBe("unprocessable");
    expect((err.details as { reason?: string } | undefined)?.reason).toBe("upgrade_required");
  });

  test("rsvp:submit over maxGuests (free) → 422 guest_limit_reached", async () => {
    const event = await stack.http.writeOk<{ id: string }>(
      "showpony:write:event:create",
      {
        title: "Guest Cap Event",
        slug: "guest-cap-event",
        startsAt: "2026-09-14T19:00:00.000Z",
        guestLimit: 1000,
      },
      guestCapHost,
    );

    const maxGuests = TIER_MAX_GUESTS.free;
    if (maxGuests === null) throw new Error("free tier has no guest cap — test premise broken");

    for (let i = 0; i < maxGuests; i++) {
      await stack.http.writeOk(
        "showpony:write:rsvp:submit",
        { eventId: event.id, name: `Guest ${i}`, status: "yes" },
        { ...guestCapHost, roles: ["anonymous"] },
      );
    }

    const err = await stack.http.writeErr(
      "showpony:write:rsvp:submit",
      { eventId: event.id, name: "One Too Many", status: "yes" },
      { ...guestCapHost, roles: ["anonymous"] },
    );
    expect(err.httpStatus).toBe(422);
    expect(err.code).toBe("unprocessable");
    expect((err.details as { reason?: string } | undefined)?.reason).toBe("guest_limit_reached");
  });
});
