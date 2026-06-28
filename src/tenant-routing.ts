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
    tenantExists: (id: TenantId): Promise<boolean> => isTenantEnabled(db, id),
  };
}
