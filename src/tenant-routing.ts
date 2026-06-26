// Subdomain → Host-Tenant. Der anonyme RSVP-Write braucht den Tenant aus
// der Request-Envelope (Host-Header), nicht aus dem Payload. Wir mappen
// <key>.<baseDomain> direkt auf den bundled `tenant.key` — kein eigenes
// Profil-Schema nötig. Apex/www/unbekannt → null (kein Tenant).
//
// tenantExists ist der defense-in-depth-Check gegen manipulierte
// X-Tenant-Header: nur eine echte, aktivierte tenant-Row gilt.

import { tenantTable } from "@cosmicdrift/kumiko-bundled-features/tenant";
import type { DbConnection } from "@cosmicdrift/kumiko-framework/db";
import { fetchOne } from "@cosmicdrift/kumiko-framework/db";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";

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
      if (host === baseDomain || host === `www.${baseDomain}`) return null;
      if (host.endsWith(`.${baseDomain}`)) {
        return enabledTenantByKey(db, host.slice(0, -(baseDomain.length + 1)));
      }
      return null;
    },
    tenantExists: (id: TenantId): Promise<boolean> => isTenantEnabled(db, id),
  };
}
