// Host → tenant lookup for managed-pages `resolveApexTenant` (branding reads on the
// subdomain pages). The anonymous-request tenant itself comes from the FW host-routing
// feature, not from here.

import { normalizeHostname } from "@cosmicdrift/kumiko-bundled-features/host-routing";
import {
  isTenantServingPublicContent,
  type TenantLifecycleStatus,
  tenantTable,
} from "@cosmicdrift/kumiko-bundled-features/tenant";
import type { DbConnection } from "@cosmicdrift/kumiko-framework/db";
import { fetchOne } from "@cosmicdrift/kumiko-framework/db";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";

type TenantRow = {
  id: TenantId;
  isEnabled: boolean;
  status: TenantLifecycleStatus;
};

// Module-global singleton, not per-stack state: acceptable because
// resolveApexTenant is wired once at static boot, never per request, and this process only
// ever runs one app stack. Bind BEFORE the first request that needs it
// (bindSubdomainPageResolver at boot) — a second stack in the same process would silently
// share this db.
let subdomainPageResolver: { db: DbConnection; baseDomain: string } | null = null;

/** Wire db for managed-pages `resolveApexTenant` (boot hook — wired once at static boot). */
export function bindSubdomainPageResolver(config: { db: DbConnection; baseDomain: string }): void {
  subdomainPageResolver = config;
}

/** Host → tenantId for managed-pages branding reads (subdomain = tenant.key). */
export async function resolveSubdomainPageTenant(host: string): Promise<TenantId | null> {
  if (!subdomainPageResolver) return null;
  const { db, baseDomain } = subdomainPageResolver;
  const hostname = normalizeHostname(host);
  if (hostname === null || !hostname.endsWith(`.${baseDomain}`)) return null;
  const key = hostname.slice(0, -(baseDomain.length + 1));
  if (key === "www") return null;
  const row = await fetchOne<TenantRow>(db, tenantTable, { key });
  return row !== undefined && isTenantServingPublicContent(row) ? row.id : null;
}
