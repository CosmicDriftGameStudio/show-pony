// Host → tenant routing options; managed-pages resolves the page tenant through the server's host routing.

import type { HostRoutingOptions } from "@cosmicdrift/kumiko-bundled-features/host-routing";

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
