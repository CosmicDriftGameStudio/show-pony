import { tenantTable } from "@cosmicdrift/kumiko-bundled-features/tenant";
import { type DbConnection, selectMany } from "@cosmicdrift/kumiko-framework/db";
import {
  type Registry,
  SYSTEM_TENANT_ID,
  type TenantId,
} from "@cosmicdrift/kumiko-framework/engine";
import {
  createInMemorySearchAdapter,
  reindexEntity,
  type SearchAdapter,
} from "@cosmicdrift/kumiko-framework/search";
import { createMeilisearchAdapter } from "@cosmicdrift/kumiko-framework/search/meilisearch";
import { Meilisearch } from "meilisearch";

// Same value as the adapter's own default; passed explicitly so the adapter
// and the drop-by-prefix in rebuildAllTenantSearchIndexes can never diverge.
export const MEILI_INDEX_PREFIX = "kumiko_";

export type MeilisearchConnection = {
  readonly url: string;
  readonly apiKey: string;
  readonly indexPrefix: string;
};

export type SearchWiring = {
  readonly adapter: SearchAdapter;
  // Undefined for the in-memory fallback: nothing persistent to clear.
  readonly meilisearch?: MeilisearchConnection;
};

export function createMeilisearchWiring(connection: MeilisearchConnection): SearchWiring {
  return {
    adapter: createMeilisearchAdapter({
      url: connection.url,
      apiKey: connection.apiKey,
      indexPrefix: connection.indexPrefix,
    }),
    meilisearch: connection,
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

const CONFIGURE_TIMEOUT_MS = 5_000;
// Drop and reindex move whole indexes, not a single settings call.
const REBUILD_TIMEOUT_MS = 60_000;
const INDEX_LIST_PAGE_SIZE = 100;

// A hung (not failing) Meilisearch task would otherwise block boot forever —
// the callers' try/catch only guards against throws, not stalls.
function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`search adapter ${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function collectSearchableFieldNames(registry: Registry): readonly string[] {
  const searchableFields = new Set<string>();
  for (const entityName of registry.getAllEntities().keys()) {
    for (const field of registry.getSearchableFields(entityName)) searchableFields.add(field);
  }
  return [...searchableFields];
}

// Boot-time sweep over all tenants: prod tenants are created at runtime via
// subdomain routing, so there is no fixed tenant list to hardcode here.
export async function configureAllTenantSearchIndexes(
  db: DbConnection,
  registry: Registry,
  searchAdapter: SearchAdapter,
  timeoutMs: number = CONFIGURE_TIMEOUT_MS,
): Promise<number> {
  const tenants = await loadEnabledTenants(db);
  await configureTenantSearchIndexes(tenants, registry, searchAdapter, timeoutMs);
  return tenants.length;
}

type EnabledTenant = { id: TenantId };

function loadEnabledTenants(db: DbConnection): Promise<readonly EnabledTenant[]> {
  return selectMany<EnabledTenant>(db, tenantTable, { isEnabled: true });
}

async function configureTenantSearchIndexes(
  tenants: readonly EnabledTenant[],
  registry: Registry,
  searchAdapter: SearchAdapter,
  timeoutMs: number,
): Promise<void> {
  const fields = collectSearchableFieldNames(registry);
  for (const tenant of tenants) {
    await withTimeout(
      searchAdapter.configure(tenant.id, { searchableFields: fields, rankingFields: fields }),
      `configure for tenant ${tenant.id}`,
      timeoutMs,
    );
  }
}

export async function dropMeilisearchIndexesWithPrefix(
  connection: MeilisearchConnection,
): Promise<number> {
  if (connection.indexPrefix === "") {
    throw new Error("refusing to drop Meilisearch indexes with an empty prefix");
  }
  const client = new Meilisearch({ host: connection.url, apiKey: connection.apiKey });
  const uids: string[] = [];
  for (let offset = 0; ; offset += INDEX_LIST_PAGE_SIZE) {
    const page = await client.getIndexes({ limit: INDEX_LIST_PAGE_SIZE, offset });
    for (const index of page.results) {
      if (index.uid.startsWith(connection.indexPrefix)) uids.push(index.uid);
    }
    if (page.results.length === 0 || offset + page.results.length >= page.total) break;
  }
  for (const uid of uids) {
    const task = await client.deleteIndex(uid).waitTask();
    if (task.status !== "succeeded") {
      throw new Error(
        `Meilisearch task ${task.uid} (deleteIndex ${uid}) ended with status "${task.status}": ${task.error?.message ?? "no error detail"}`,
      );
    }
  }
  return uids.length;
}

export type SearchRebuildSummary = {
  readonly tenants: number;
  readonly indexedRows: number;
  readonly droppedIndexes: number;
  readonly failedReindexes: number;
};

// resetDbOnDeploy wipes the DB but not the persistent Meilisearch volume, so
// the index is dropped and rebuilt on every boot (DB = source of truth). A
// clear without a reindex would lose documents on a plain restart, where the
// event-consumer cursor already sits at head.
export async function rebuildAllTenantSearchIndexes(
  db: DbConnection,
  registry: Registry,
  wiring: SearchWiring,
  timeoutMs: number = REBUILD_TIMEOUT_MS,
): Promise<SearchRebuildSummary> {
  const droppedIndexes = wiring.meilisearch
    ? await withTimeout(
        dropMeilisearchIndexesWithPrefix(wiring.meilisearch),
        "index drop",
        timeoutMs,
      )
    : 0;
  const tenants = await loadEnabledTenants(db);
  await configureTenantSearchIndexes(tenants, registry, wiring.adapter, CONFIGURE_TIMEOUT_MS);

  let indexedRows = 0;
  let failedReindexes = 0;
  for (const [entityName, entity] of registry.getAllEntities()) {
    const isSearchIndexed =
      registry.getSearchableFields(entityName).length > 0 ||
      registry.getSearchPayloadExtensions(entityName).length > 0;
    if (!isSearchIndexed) continue;
    const tenantIds = entity.systemStream === true ? [SYSTEM_TENANT_ID] : tenants.map((t) => t.id);
    for (const tenantId of tenantIds) {
      try {
        const result = await withTimeout(
          reindexEntity(db, registry, wiring.adapter, entityName, tenantId),
          `reindex of ${entityName} for tenant ${tenantId}`,
          timeoutMs,
        );
        indexedRows += result.indexedRows;
        if (result.failures.length > 0) {
          // biome-ignore lint/suspicious/noConsole: operator-visible boot warning, partial reindex must not crash-loop the pod
          console.warn(
            `[show-pony][search] reindex of ${entityName} for tenant ${tenantId}: ${result.failures.length} failed rows, first: ${result.failures[0]?.reason}`,
          );
        }
      } catch (err) {
        // One broken or stalled tenant index must not leave the remaining tenants unindexed.
        failedReindexes += 1;
        // biome-ignore lint/suspicious/noConsole: operator-visible boot warning, one failed reindex must not abort the sweep
        console.warn(
          `[show-pony][search] reindex of ${entityName} for tenant ${tenantId} failed: ${err}`,
        );
      }
    }
  }
  return { tenants: tenants.length, indexedRows, droppedIndexes, failedReindexes };
}
