// rsvp:list/rsvp:detail carry guest PII (name/email/note) — they are
// Admin-only reads, not openToAll (kumiko-framework#2854 checklist item C
// follow-up). Proves the boundary with real HTTP calls: a plain "User"
// member of the tenant is denied, Admin can read.

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
import { createShowPonyAnonymousAccess } from "../tenant-routing";

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

const BASE_DOMAIN = "show-pony.test";
const ACME = testTenantId(1);

let stack: TestStack;
let eventId: string;
let rsvpId: string;
const admin = { ...TestUsers.admin, tenantId: ACME };
const member = { ...TestUsers.user, tenantId: ACME };

beforeAll(async () => {
  stack = await setupTestStack({
    features: [
      createConfigFeature(),
      createManagedPagesFeature({ resolveApexTenant: async () => null }),
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    anonymousAccess: ({ db }) => createShowPonyAnonymousAccess({ db, baseDomain: BASE_DOMAIN }),
    extraContext: ({ registry }) => ({
      configResolver,
      _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    }),
  });
  await unsafeCreateEntityTable(stack.db, tenantEntity);
  await unsafeCreateEntityTable(stack.db, eventEntity, "event");
  await unsafeCreateEntityTable(stack.db, rsvpEntity, "rsvp");
  await unsafePushTables(stack.db, {
    configValuesTable,
    tier_assignments: tierAssignmentTable,
  });
  await createEventsTable(stack.db);
  await seedTenant(stack.db, { id: ACME, key: "acme", name: "Acme" });

  const event = await stack.http.writeOk<{ id: string }>(
    "showpony:write:event:create",
    {
      title: "Access-control test event",
      slug: "rsvp-access-control-test",
      startsAt: "2026-09-12T19:00:00.000Z",
      guestLimit: 50,
    },
    admin,
  );
  eventId = event.id;

  // rsvp:submit's access is access.anonymous (truly unauthenticated), not
  // "any signed-in caller" — submit it the same way the anonymous-flow
  // tests do, via the subdomain resolver, not writeOk with a session user.
  const submitRes = await stack.http.raw(
    "POST",
    "/api/write",
    {
      type: "showpony:write:rsvp:submit",
      payload: { eventId, name: "Guest One", email: "guest-one@acme.test", status: "yes" },
    },
    { Host: `acme.${BASE_DOMAIN}` },
  );
  const submitBody = (await submitRes.json()) as { data: { id: string } };
  rsvpId = submitBody.data.id;
});

afterAll(async () => stack?.cleanup());

describe("rsvp:list / rsvp:detail — Admin-only reads", () => {
  test("a plain tenant member is denied on both list and detail", async () => {
    const listRes = await stack.http.query("showpony:query:rsvp:list", {}, member);
    expect(listRes.status).toBe(403);
    const listBody = (await listRes.json()) as { error: { code: string } };
    expect(listBody.error.code).toBe("access_denied");

    const detailRes = await stack.http.query("showpony:query:rsvp:detail", { id: rsvpId }, member);
    expect(detailRes.status).toBe(403);
    const detailBody = (await detailRes.json()) as { error: { code: string } };
    expect(detailBody.error.code).toBe("access_denied");
  });

  test("Admin can list and view RSVP detail, including the guest's email", async () => {
    const listRes = await stack.http.query("showpony:query:rsvp:list", {}, admin);
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      data: { rows: ReadonlyArray<{ id: string; name: string; email?: string }> };
    };
    expect(listBody.data.rows.map((r) => r.name)).toContain("Guest One");

    const detailRes = await stack.http.query("showpony:query:rsvp:detail", { id: rsvpId }, admin);
    expect(detailRes.status).toBe(200);
    const detailBody = (await detailRes.json()) as {
      data: { name: string; email?: string };
    };
    expect(detailBody.data.name).toBe("Guest One");
    expect(detailBody.data.email).toBe("guest-one@acme.test");
  });
});
