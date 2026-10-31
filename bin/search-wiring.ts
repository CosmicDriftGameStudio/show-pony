import { tenantTable } from "@cosmicdrift/kumiko-bundled-features/tenant";
import { runWithTimeout } from "@cosmicdrift/kumiko-framework/api";
import { type DbConnection, selectMany } from "@cosmicdrift/kumiko-framework/db";
import type { Registry, TenantId } from "@cosmicdrift/kumiko-framework/engine";
import {
  createInMemorySearchAdapter,
  type ReindexTenantsSearchResult,
  reindexTenantsSearch,
  type SearchAdapter,
} from "@cosmicdrift/kumiko-framework/search";
import { createMeilisearchAdapter } from "@cosmicdrift/kumiko-framework/search/meilisearch";

export const MEILI_INDEX_PREFIX = "kumiko_";

export type MeilisearchConnection = {
  readonly url: string;
  readonly apiKey: string;
  readonly indexPrefix: string;
};

export type SearchWiring = {
  readonly adapter: SearchAdapter;
};

export function createMeilisearchWiring(connection: MeilisearchConnection): SearchWiring {
  return {
    adapter: createMeilisearchAdapter({
      url: connection.url,
      apiKey: connection.apiKey,
      indexPrefix: connection.indexPrefix,
    }),
  };
}

export function resolveSearchAdapter(env: {
  MEILI_URL?: string;
  MEILI_MASTER_KEY?: string;
}): SearchWiring {
  const url = env.MEILI_URL?.trim() || undefined;
  const apiKey = env.MEILI_MASTER_KEY?.trim() || undefined;
  if (url && apiKey) {
    return createMeilisearchWiring({ url, apiKey, indexPrefix: MEILI_INDEX_PREFIX });
  }
  // The in-memory fallback is for local runs without Meilisearch; prod gets
  // MEILI_URL via infra `meilisearch: true`.
  if (!url && !apiKey) return { adapter: createInMemorySearchAdapter() };
  throw new Error(
    "MEILI_URL and MEILI_MASTER_KEY must both be set or both be unset — got only one",
  );
}

// Drop and reindex move whole indexes, not a single settings call.
const REBUILD_TIMEOUT_MS = 60_000;

// Search reads the index of the session's tenant, so only enabled tenants need one. The tenant rows
// themselves are a global system stream under SYSTEM_TENANT_ID; no membership points there, so that
// index is never read.
async function loadEnabledTenantIds(db: DbConnection): Promise<readonly TenantId[]> {
  const tenants = await selectMany<{ id: TenantId }>(db, tenantTable, { isEnabled: true });
  return tenants.map((tenant) => tenant.id);
}

export type SearchRebuildSummary = ReindexTenantsSearchResult & {
  readonly droppedIndexes: number;
};

// resetDbOnDeploy wipes the DB but not the persistent Meilisearch volume, so
// the index is dropped and rebuilt on every boot (DB = source of truth). A
// clear without a reindex would lose documents on a plain restart, where the
// event-consumer cursor already sits at head.
export async function rebuildAllTenantSearchIndexes(
  db: DbConnection,
  registry: Registry,
  wiring: SearchWiring,
  reindexTimeoutMs: number = REBUILD_TIMEOUT_MS,
): Promise<SearchRebuildSummary> {
  // The drop keeps the full budget: it moves every index at once, a reindex only one entity of one
  // tenant. A hung (not failing) Meilisearch task would otherwise block boot forever.
  const drop = await runWithTimeout(
    async () => (wiring.adapter.dropAllIndexes ? wiring.adapter.dropAllIndexes() : 0),
    REBUILD_TIMEOUT_MS,
  );
  if (!drop.ok) {
    if (drop.timedOut) {
      throw new Error(`search adapter index drop timed out after ${REBUILD_TIMEOUT_MS}ms`);
    }
    throw drop.error;
  }
  const droppedIndexes = drop.value;
  const tenantIds = await loadEnabledTenantIds(db);
  const result = await reindexTenantsSearch(db, registry, wiring.adapter, {
    tenantIds,
    timeoutMs: reindexTimeoutMs,
    warn: (message) => console.warn(`[show-pony]${message}`),
  });
  return { ...result, droppedIndexes };
}
