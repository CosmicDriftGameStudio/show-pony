import { tenantTable } from "@cosmicdrift/kumiko-bundled-features/tenant";
import { runWithTimeout } from "@cosmicdrift/kumiko-framework/api";
import { type DbConnection, selectMany } from "@cosmicdrift/kumiko-framework/db";
import type { Registry, TenantId } from "@cosmicdrift/kumiko-framework/engine";
import {
  type ReindexTenantsSearchResult,
  reindexTenantsSearch,
  type SearchAdapter,
} from "@cosmicdrift/kumiko-framework/search";

export const MEILI_INDEX_PREFIX = "kumiko_";

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
  adapter: SearchAdapter,
  reindexTimeoutMs: number = REBUILD_TIMEOUT_MS,
): Promise<SearchRebuildSummary> {
  // The drop keeps the full budget: it moves every index at once, a reindex only one entity of one
  // tenant. A hung (not failing) Meilisearch task would otherwise block boot forever.
  const drop = await runWithTimeout(
    async () => (adapter.dropAllIndexes ? adapter.dropAllIndexes() : 0),
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
  const result = await reindexTenantsSearch(db, registry, adapter, {
    tenantIds,
    timeoutMs: reindexTimeoutMs,
    warn: (message) => console.warn(`[show-pony]${message}`),
  });
  return { ...result, droppedIndexes };
}
