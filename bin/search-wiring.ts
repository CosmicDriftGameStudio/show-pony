import { tenantTable } from "@cosmicdrift/kumiko-bundled-features/tenant";
import { type DbConnection, selectMany } from "@cosmicdrift/kumiko-framework/db";
import type { Registry, TenantId } from "@cosmicdrift/kumiko-framework/engine";
import {
  createInMemorySearchAdapter,
  type SearchAdapter,
} from "@cosmicdrift/kumiko-framework/search";
import { createMeilisearchAdapter } from "@cosmicdrift/kumiko-framework/search/meilisearch";

export function resolveSearchAdapter(env: {
  MEILI_URL?: string;
  MEILI_MASTER_KEY?: string;
}): SearchAdapter {
  const url = env.MEILI_URL?.trim() || undefined;
  const apiKey = env.MEILI_MASTER_KEY?.trim() || undefined;
  if (url && apiKey) return createMeilisearchAdapter({ url, apiKey });
  // Infra never sets `meilisearch: true` for show-pony, so MEILI_URL is
  // never injected in prod. Single replica + resetDbOnDeploy make an
  // in-memory index acceptable, and it beats a hard 422 on every guest search.
  if (!url && !apiKey) return createInMemorySearchAdapter();
  throw new Error(
    "MEILI_URL and MEILI_MASTER_KEY must both be set or both be unset — got only one",
  );
}

const CONFIGURE_TIMEOUT_MS = 5_000;

// A hung (not failing) Meilisearch task would otherwise block boot forever —
// the callers' try/catch only guards against throws, not stalls.
function withTimeout<T>(promise: Promise<T>, tenantId: TenantId, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(`search adapter configure timed out for tenant ${tenantId} after ${timeoutMs}ms`),
      );
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
  const fields = collectSearchableFieldNames(registry);
  const tenants = await selectMany<{ id: TenantId }>(db, tenantTable, { isEnabled: true });
  for (const tenant of tenants) {
    await withTimeout(
      searchAdapter.configure(tenant.id, { searchableFields: fields, rankingFields: fields }),
      tenant.id,
      timeoutMs,
    );
  }
  return tenants.length;
}
