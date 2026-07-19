// Smoke test for the "event" projection surviving a rebuild — the concern
// behind kumiko/migrations/0002_fix_starts_at_timestamp.sql +
// 0003_rebuild_after_migrate_crash.sql (both mark read_events for rebuild).
// Neither migration's SQL is replayed here (that needs the historical
// pre-fix schema); instead this pins the invariant those migrations exist
// to protect: a rebuild from the event log must reproduce the exact same
// startsAt timestamptz and leave the row findable by slug, not just "some
// row exists". A regression here (e.g. a timezone-lossy apply) would have
// caught the bug 0002 fixed before it needed a migration at all.

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
import { rebuildProjection } from "@cosmicdrift/kumiko-framework/pipeline";
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

let stack: TestStack;
const TENANT_ID = testTenantId(1);
const host = { ...TestUsers.admin, tenantId: TENANT_ID };

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
  await unsafePushTables(stack.db, { tier_assignments: tierAssignmentTable });
  await createEventsTable(stack.db);
  await seedTenant(stack.db, { id: TENANT_ID, key: "rebuildcheck", name: "Rebuild Check" });
});

afterAll(async () => stack?.cleanup());

describe("read_events survives a projection rebuild (0002/0003 invariant)", () => {
  test("startsAt + slug lookup are identical before and after rebuild", async () => {
    const created = await stack.http.writeOk<{ id: string; startsAt: string }>(
      "showpony:write:event:create",
      {
        title: "Rebuild Smoke Event",
        slug: "rebuild-smoke-event",
        startsAt: "2026-09-12T19:00:00.000Z",
        guestLimit: 10,
      },
      host,
    );

    const beforeQuery = await stack.http.queryOk<{ rows: Array<{ id: string; startsAt: string }> }>(
      "showpony:query:event:list",
      {},
      host,
    );
    const beforeRow = beforeQuery.rows.find((r) => r.id === created.id);
    expect(beforeRow?.startsAt).toBe("2026-09-12T19:00:00Z");

    const projectionName = [...stack.registry.getAllProjections().keys()].find((name) =>
      name.startsWith("showpony:projection:event"),
    );
    if (!projectionName) throw new Error("showpony event projection not found in registry");

    const result = await rebuildProjection(projectionName, {
      db: stack.db,
      registry: stack.registry,
    });
    expect(result.eventsProcessed).toBeGreaterThan(0);

    const afterQuery = await stack.http.queryOk<{ rows: Array<{ id: string; startsAt: string }> }>(
      "showpony:query:event:list",
      {},
      host,
    );
    const afterRow = afterQuery.rows.find((r) => r.id === created.id);
    expect(afterRow?.startsAt).toBe(beforeRow?.startsAt);
  });
});
