// event:create/update/delete are Admin-only writes (kumiko-framework#2854
// checklist item C follow-up to #195/#197's rsvp access-control change) —
// events carry no guest PII, so the risk is destruction (any tenant member
// editing/deleting another member's event), not confidentiality. Reads
// (event:list/event:detail) stay openToAll. Proves the boundary with real
// HTTP calls: a plain "User" member of the tenant is denied on writes but
// can still read, Admin can do both.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
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

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

const ACME = testTenantId(1);
let stack: TestStack;
let eventId: string;
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
    extraContext: ({ registry }) => ({
      configResolver,
      _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    }),
  });
  await unsafeCreateEntityTable(stack.db, tenantEntity);
  await unsafeCreateEntityTable(stack.db, eventEntity, "event");
  await unsafeCreateEntityTable(stack.db, rsvpEntity, "rsvp");
  await unsafePushTables(stack.db, { tier_assignments: tierAssignmentTable });
  await createEventsTable(stack.db);
  await seedTenant(stack.db, { id: ACME, key: "acme", name: "Acme" });

  const event = await stack.http.writeOk<{ id: string }>(
    "showpony:write:event:create",
    {
      title: "Access-control test event",
      slug: "event-access-control-test",
      startsAt: "2026-09-12T19:00:00.000Z",
      guestLimit: 50,
    },
    admin,
  );
  eventId = event.id;
});

afterAll(async () => stack?.cleanup());

describe("event:create/update/delete — Admin-only writes, reads stay open", () => {
  test("a plain tenant member is denied on create/update/delete", async () => {
    const createErr = await stack.http.writeErr(
      "showpony:write:event:create",
      {
        title: "Member's event",
        slug: "member-event",
        startsAt: "2026-09-12T19:00:00.000Z",
        guestLimit: 10,
      },
      member,
    );
    expect(createErr.httpStatus).toBe(403);
    expect(createErr.code).toBe("access_denied");

    const updateErr = await stack.http.writeErr(
      "showpony:write:event:update",
      { id: eventId, version: 1, changes: { title: "Hijacked title" } },
      member,
    );
    expect(updateErr.httpStatus).toBe(403);
    expect(updateErr.code).toBe("access_denied");

    const deleteErr = await stack.http.writeErr(
      "showpony:write:event:delete",
      { id: eventId },
      member,
    );
    expect(deleteErr.httpStatus).toBe(403);
    expect(deleteErr.code).toBe("access_denied");
  });

  test("a plain tenant member can still list and view event detail", async () => {
    const list = await stack.http.queryOk<{ rows: ReadonlyArray<{ id: string }> }>(
      "showpony:query:event:list",
      {},
      member,
    );
    expect(list.rows.map((r) => r.id)).toContain(eventId);

    const detail = await stack.http.queryOk<{ id: string; title: string }>(
      "showpony:query:event:detail",
      { id: eventId },
      member,
    );
    expect(detail.title).toBe("Access-control test event");
  });

  test("Admin can create, update and delete an event", async () => {
    // free tier caps at 1 event (cap-enforcement.integration.test.ts) and
    // beforeAll already used the slot — delete it first so create has room,
    // which also proves Admin can delete the event the earlier tests read.
    await stack.http.writeOk("showpony:write:event:delete", { id: eventId }, admin);

    const created = await stack.http.writeOk<{ id: string }>(
      "showpony:write:event:create",
      {
        title: "Admin CRUD event",
        slug: "admin-crud-event",
        startsAt: "2026-09-13T19:00:00.000Z",
        guestLimit: 20,
      },
      admin,
    );

    const updated = await stack.http.writeOk<{ id: string; data: { title: string } }>(
      "showpony:write:event:update",
      { id: created.id, version: 1, changes: { title: "Admin CRUD event (renamed)" } },
      admin,
    );
    expect(updated.data.title).toBe("Admin CRUD event (renamed)");

    await stack.http.writeOk("showpony:write:event:delete", { id: created.id }, admin);
  });
});
