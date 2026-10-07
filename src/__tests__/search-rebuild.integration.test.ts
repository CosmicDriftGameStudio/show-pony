// resetDbOnDeploy wipes the DB but the Meilisearch volume survives: the boot
// rebuild must drop stale documents/indexes and re-derive the index from the
// DB. Runs against a real Meilisearch (docker compose / CI service, port 17700)
// and needs it — no skip when it is missing.

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
import type { EntityId, SessionUser, TenantId } from "@cosmicdrift/kumiko-framework/engine";
import { type TestStack, unsafePushTables } from "@cosmicdrift/kumiko-framework/stack";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { Meilisearch } from "meilisearch";
import {
  createMeilisearchWiring,
  dropMeilisearchIndexesWithPrefix,
  type MeilisearchConnection,
  rebuildAllTenantSearchIndexes,
  type SearchWiring,
} from "../../bin/search-wiring";
import { showPonyFeature } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { createShowPonyAnonymousAccess } from "../tenant-routing";

const BASE_DOMAIN = "show-pony.test";
const GUEST_ONE = "Zephyrine Quoxley";
const GUEST_TWO = "Bartholomew Grumpkin";
const STALE_GUEST = "Ghostwriter Vanished";
const OTHER_TENANT_GUEST = "Cornelius Fandango";

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

// Unique prefix: parallel runs and other apps share the same Meilisearch.
const connection: MeilisearchConnection = {
  url: process.env["MEILI_URL"] ?? "http://localhost:17700",
  apiKey: process.env["MEILI_MASTER_KEY"] ?? "kumiko-dev-key",
  indexPrefix: `sp_rebuild_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}_`,
};
const wiring = createMeilisearchWiring(connection);
const meili = new Meilisearch({ host: connection.url, apiKey: connection.apiKey });

let stack: TestStack;
let tenantId: TenantId;
let otherTenantId: TenantId;
let staleRsvpId: EntityId;
const foreignTenantId = crypto.randomUUID() as TenantId;

async function indexUidsWithPrefix(): Promise<string[]> {
  const page = await meili.getIndexes({ limit: 1000 });
  return page.results.map((i) => i.uid).filter((uid) => uid.startsWith(connection.indexPrefix));
}

async function seedStaleDocuments(): Promise<void> {
  const fields = ["name", "email"];
  const config = { searchableFields: fields, rankingFields: fields };
  await wiring.adapter.configure(tenantId, config);
  await wiring.adapter.index(tenantId, {
    entityType: "rsvp",
    entityId: staleRsvpId,
    weight: 1,
    fields: { name: STALE_GUEST },
  });
  await wiring.adapter.configure(foreignTenantId, config);
  await wiring.adapter.index(foreignTenantId, {
    entityType: "rsvp",
    entityId: crypto.randomUUID() as EntityId,
    weight: 1,
    fields: { name: STALE_GUEST },
  });
}

async function findIds(query: string, forTenant: TenantId = tenantId): Promise<string[]> {
  const hits = await wiring.adapter.search(forTenant, query);
  return hits.map((h) => String(h.entityId));
}

beforeAll(async () => {
  stack = await setupAppTestStack(
    [
      createConfigFeature(),
      createManagedPagesFeature({ resolveApexTenant: async () => null }),
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    {
      anonymousAccess: ({ db }) => createShowPonyAnonymousAccess({ db, baseDomain: BASE_DOMAIN }),
      extraContext: ({ registry }) => ({
        configResolver,
        _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
      }),
    },
  );
  await unsafePushTables(stack.db, {
    configValuesTable,
    tier_assignments: tierAssignmentTable,
  });
  const tenant = await seedTenant(stack, { name: "Rebuild Host", persist: true });
  tenantId = tenant.id as TenantId;
  staleRsvpId = crypto.randomUUID() as EntityId;
  await seedEventWithGuests(tenant, "rebuild-party", [GUEST_ONE, GUEST_TWO]);

  const otherTenant = await seedTenant(stack, { name: "Rebuild Other Host", persist: true });
  otherTenantId = otherTenant.id as TenantId;
  await seedEventWithGuests(otherTenant, "other-party", [OTHER_TENANT_GUEST]);
});

async function seedEventWithGuests(
  tenant: Awaited<ReturnType<typeof seedTenant>>,
  slug: string,
  guestNames: readonly string[],
): Promise<void> {
  const host: SessionUser = (await tenant.addUser(["Admin"])).session;
  const hostname = `${tenant.key}.${BASE_DOMAIN}`;
  const event = await stack.http.writeOk<{ id: string }>(
    "showpony:write:event:create",
    {
      title: `Party ${slug}`,
      slug,
      startsAt: "2026-09-12T19:00:00.000Z",
      guestLimit: 50,
    },
    host,
  );
  for (const name of guestNames) {
    const res = await stack.http.raw(
      "POST",
      "/api/write",
      {
        type: "showpony:write:rsvp:submit",
        payload: { eventId: event.id, name, email: "guest@example.test", status: "yes" },
      },
      { Host: hostname },
    );
    expect(res.status).toBe(200);
  }
}

afterAll(async () => {
  await dropMeilisearchIndexesWithPrefix(connection);
  await stack?.cleanup();
});

describe("rebuildAllTenantSearchIndexes (real Meilisearch)", () => {
  test("drops stale documents and foreign-tenant indexes, reindexes the real RSVPs, idempotently", async () => {
    await seedStaleDocuments();
    expect(await findIds(STALE_GUEST)).toContain(String(staleRsvpId));
    expect(await indexUidsWithPrefix()).toHaveLength(2);

    const first = await rebuildAllTenantSearchIndexes(stack.db, stack.registry, wiring);

    expect(first.droppedIndexes).toBe(2);
    expect(first.tenants).toBeGreaterThanOrEqual(1);
    expect(await findIds(STALE_GUEST)).toEqual([]);
    expect(await findIds(GUEST_ONE)).toHaveLength(1);
    expect(await findIds(GUEST_TWO)).toHaveLength(1);
    const uidsAfterFirst = await indexUidsWithPrefix();
    expect(uidsAfterFirst.some((uid) => uid.endsWith(foreignTenantId))).toBe(false);

    const second = await rebuildAllTenantSearchIndexes(stack.db, stack.registry, wiring);

    expect(second.indexedRows).toBe(first.indexedRows);
    expect(second.tenants).toBe(first.tenants);
    expect(await findIds(GUEST_ONE)).toHaveLength(1);
    expect(await findIds(GUEST_TWO)).toHaveLength(1);
    expect(await findIds(STALE_GUEST)).toEqual([]);
    expect(await indexUidsWithPrefix()).toEqual(uidsAfterFirst);
  });

  test("a stalled reindex for one tenant is counted and does not stop the other tenants", async () => {
    const stallingWiring: SearchWiring = {
      ...wiring,
      adapter: {
        configure: (id, config) => wiring.adapter.configure(id, config),
        index: (id, doc) =>
          id === tenantId ? new Promise(() => {}) : wiring.adapter.index(id, doc),
        indexBatch: wiring.adapter.indexBatch
          ? (id, docs) =>
              id === tenantId
                ? new Promise(() => {})
                : (wiring.adapter.indexBatch as NonNullable<typeof wiring.adapter.indexBatch>)(
                    id,
                    docs,
                  )
          : undefined,
        search: (id, query, options) => wiring.adapter.search(id, query, options),
        remove: (id, entityType, entityId) => wiring.adapter.remove(id, entityType, entityId),
      },
    };

    const summary = await rebuildAllTenantSearchIndexes(
      stack.db,
      stack.registry,
      stallingWiring,
      3_000,
    );

    // The stalled tenant has three search-indexed entities: its own tenant row, event and rsvp.
    expect(summary.failedReindexes).toBe(3);
    expect(await findIds(OTHER_TENANT_GUEST, otherTenantId)).toHaveLength(1);
    expect(await findIds(GUEST_ONE)).toEqual([]);
  });

  test("a failing configure for one tenant is counted, skips its reindex and does not stop the other tenants", async () => {
    const failingConfigureWiring: SearchWiring = {
      ...wiring,
      adapter: {
        ...wiring.adapter,
        configure: (id, config) =>
          id === tenantId
            ? Promise.reject(new Error("meilisearch settings task failed"))
            : wiring.adapter.configure(id, config),
      },
    };

    const summary = await rebuildAllTenantSearchIndexes(
      stack.db,
      stack.registry,
      failingConfigureWiring,
    );

    expect(summary.failedConfigures).toBe(1);
    expect(summary.failedReindexes).toBe(0);
    expect(await findIds(OTHER_TENANT_GUEST, otherTenantId)).toHaveLength(1);
    // No index is created for the unconfigured tenant: it would default to searchableAttributes ["*"].
    expect((await indexUidsWithPrefix()).some((uid) => uid.endsWith(tenantId))).toBe(false);
  });
});
