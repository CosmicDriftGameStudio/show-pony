// Subdomain → host tenant. The anonymous RSVP write needs the tenant from the
// request envelope (the Host header), never from the payload — otherwise a
// guest could forge it. We map <key>.<baseDomain> straight onto the bundled
// `tenant.key`, so there's no extra profile schema. Apex / www / unknown all
// resolve to null (no tenant).
//
// tenantExists is the defense-in-depth check against a forged X-Tenant header:
// only a real, enabled tenant row counts.

import { tenantTable } from "@cosmicdrift/kumiko-bundled-features/tenant";
import type { DbConnection } from "@cosmicdrift/kumiko-framework/db";
import { fetchOne } from "@cosmicdrift/kumiko-framework/db";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import { isSystemTenant, SYSTEM_TENANT_ID } from "@cosmicdrift/kumiko-framework/engine";

// Strip the port: "acme.show-pony.localhost:4180" → "acme.show-pony.localhost".
export function hostnameOf(host: string): string {
  const i = host.indexOf(":");
  return i === -1 ? host : host.slice(0, i);
}

type TenantRow = { id: TenantId; isEnabled: boolean };

async function enabledTenantByKey(db: DbConnection, key: string): Promise<TenantId | null> {
  const row = await fetchOne<TenantRow>(db, tenantTable, { key });
  return row !== undefined && row.isEnabled === true ? row.id : null;
}

async function isTenantEnabled(db: DbConnection, id: TenantId): Promise<boolean> {
  const row = await fetchOne<TenantRow>(db, tenantTable, { id });
  return row !== undefined && row.isEnabled === true;
}

export function createShowPonyTenantResolver(config: { db: DbConnection; baseDomain: string }) {
  const { db, baseDomain } = config;
  return {
    tenantResolver: async (c: {
      req: { header: (n: string) => string | undefined };
    }): Promise<TenantId | null> => {
      const host = hostnameOf(c.req.header("Host") ?? "");
      // Apex / www: the host's own login, not a guest surface — no tenant.
      if (host === baseDomain || host === `www.${baseDomain}`) return null;
      // <key>.<baseDomain>: the subdomain IS the tenant key.
      if (host.endsWith(`.${baseDomain}`)) {
        return enabledTenantByKey(db, host.slice(0, -(baseDomain.length + 1)));
      }
      return null;
    },
    tenantExists: (id: TenantId): Promise<boolean> =>
      isSystemTenant(id) ? Promise.resolve(true) : isTenantEnabled(db, id),
    // Host-derived, not client-controlled — see createShowPonyAnonymousAccess.
    resolverTrust: "authoritative" as const,
  };
}

/** Apex anonymous routes (legal pages) need SYSTEM tenant; subdomains keep host tenant. */
// Module-global singleton, not per-stack state: acceptable because
// APP_FEATURES/resolveApexTenant are wired once at static boot, never per
// request, and this process only ever runs one app stack. Bind BEFORE the
// first request that needs it (bindSubdomainPageResolver at boot) — a
// second stack in the same process would silently share this db.
let subdomainPageResolver: { db: DbConnection; baseDomain: string } | null = null;

/** Wire db for managed-pages `resolveApexTenant` (boot hook — APP_FEATURES is static). */
export function bindSubdomainPageResolver(config: { db: DbConnection; baseDomain: string }): void {
  subdomainPageResolver = config;
}

/** Host → tenantId for managed-pages branding reads (subdomain = tenant.key). */
export async function resolveSubdomainPageTenant(host: string): Promise<TenantId | null> {
  if (!subdomainPageResolver) return null;
  const { db, baseDomain } = subdomainPageResolver;
  const h = hostnameOf(host);
  if (h === baseDomain || h === `www.${baseDomain}`) return null;
  if (h.endsWith(`.${baseDomain}`)) {
    return enabledTenantByKey(db, h.slice(0, -(baseDomain.length + 1)));
  }
  return null;
}

export function createShowPonyAnonymousAccess(config: { db: DbConnection; baseDomain: string }) {
  const subdomain = createShowPonyTenantResolver(config);
  const { baseDomain } = config;
  return {
    tenantResolver: async (c: {
      req: { header: (n: string) => string | undefined };
    }): Promise<TenantId | null> => {
      const host = hostnameOf(c.req.header("Host") ?? "");
      // Apex anon is read-only-GET by design (legal pages) — this resolver
      // itself doesn't gate writes. The only reason apex-origin anonymous
      // writes into SYSTEM_TENANT_ID can't happen is DEMO_READ_ONLY + the
      // origin guard upstream; if either is ever dropped, writes for
      // SYSTEM_TENANT_ID from this path must be rejected explicitly here.
      if (host === baseDomain || host === `www.${baseDomain}`) return SYSTEM_TENANT_ID;
      return subdomain.tenantResolver(c);
    },
    tenantExists: subdomain.tenantExists,
    // Host-derived, not client-controlled — the resolver's answer is final.
    // A client-supplied X-Tenant header disagreeing with it (e.g. a guest
    // on acme.show-pony.<domain> claiming Globex's real tenant id) is
    // rejected with 400 tenant_mismatch instead of silently overriding the
    // subdomain (kumiko-platform#278/1 / #51). This additionally closes the
    // apex X-Tenant header override (now 400s directly instead of trusting
    // the header) — it does NOT close the header-less apex write path: that
    // one still relies solely on DEMO_READ_ONLY + the origin guard upstream,
    // per the resolverTrust comment above.
    resolverTrust: "authoritative" as const,
  };
}
