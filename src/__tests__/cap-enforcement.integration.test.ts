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
import type { SessionUser } from "@cosmicdrift/kumiko-framework/engine";
import { type TestStack, unsafePushTables } from "@cosmicdrift/kumiko-framework/stack";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { showPonyFeature } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { TIER_MAX_GUESTS } from "../marketing/pricing";

let stack: TestStack;

// Same appOverride as bin/server.ts — mail-foundation needs a selected
// provider or createTransportForTenant throws "no provider selected".
const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

const managedPages = createManagedPagesFeature({ resolveApexTenant: async () => null });

let host: SessionUser;
let guestCapHost: SessionUser;

beforeAll(async () => {
  stack = await setupAppTestStack(
    [
      createConfigFeature(),
      managedPages,
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    {
      extraContext: ({ registry }) => ({
        configResolver,
        _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
      }),
    },
  );
  await unsafePushTables(stack.db, {
    tier_assignments: tierAssignmentTable,
    config_values: configValuesTable,
  });
  const capcheck = await seedTenant(stack, { name: "Cap Check" });
  const guestCapTenant = await seedTenant(stack, { name: "Guest Cap Check" });
  // seedTenant's admin carries ROLES.TenantAdmin, not show-pony's own
  // "Admin" role that event/rsvp handlers gate on — addUser mints that role.
  host = (await capcheck.addUser(["Admin"])).session;
  guestCapHost = (await guestCapTenant.addUser(["Admin"])).session;
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
