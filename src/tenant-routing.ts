// Host → tenant routing options plus the lookup for managed-pages `resolveApexTenant`
// (branding reads on the subdomain pages). The mapping is the FW host-routing one; only the
// db is late-bound because managed-pages calls the resolver with the host alone.

import {
  createHostTenantIdResolver,
  type HostRoutingOptions,
} from "@cosmicdrift/kumiko-bundled-features/host-routing";
import { createTenantDb, type DbConnection } from "@cosmicdrift/kumiko-framework/db";
import { SYSTEM_TENANT_ID, type TenantId } from "@cosmicdrift/kumiko-framework/engine";

/** The host decides the tenant: apex = host surface, `<key>.<baseDomain>` = guest pages.
 *  No apexAnonymousTenantId, so anonymous writes on the apex keep answering tenant_required. */
export function showPonyHostRoutingOptions(baseDomain: string): HostRoutingOptions {
  return {
    tenantBy: "host",
    baseDomain,
    apex: { file: "admin.html" },
    tenant: { file: "index.html" },
    unknownTenant: { file: "index.html" },
  };
}

// Module-global singleton: the process runs one app stack and binds once at static boot,
// before the first request that needs it.
let boundResolver: ((host: string) => Promise<TenantId | null>) | null = null;

export function bindSubdomainPageResolver(config: { db: DbConnection; baseDomain: string }): void {
  // managed-pages resolves the host before any tenant is established, so the raw connection would
  // read no row under row-level security. Tenant rows are global (SYSTEM_TENANT_ID), so a handle on
  // that tenant reads them without the system scope.
  boundResolver = createHostTenantIdResolver(
    showPonyHostRoutingOptions(config.baseDomain),
    createTenantDb({ db: config.db, tenantId: SYSTEM_TENANT_ID }),
  );
}

export async function resolveSubdomainPageTenant(host: string): Promise<TenantId | null> {
  return boundResolver === null ? null : boundResolver(host);
}
