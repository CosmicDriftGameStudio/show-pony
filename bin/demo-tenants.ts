// Demo tenants for show-pony — shared by bin/server.ts and bin/main.ts.
//
// demo: Mira's host tenant (events, guest list, public subdomain).
// acme: second demo tenant for isolation proof (separate subdomain).
// _platform: internal anchor for sysadmin login only — not a customer subdomain.

import { seedAdmin } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/seeding";
import type { DbConnection } from "@cosmicdrift/kumiko-framework/db";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";

export type DemoTenant = {
  readonly id: TenantId;
  readonly tenantKey: string;
  readonly name: string;
};

export const DEMO_TENANT: DemoTenant = {
  id: "00000000-0000-4000-8000-0000000000a1" as TenantId,
  tenantKey: "demo",
  name: "Demo Host",
};

export const ACME_TENANT: DemoTenant = {
  id: "00000000-0000-4000-8000-0000000000a2" as TenantId,
  tenantKey: "acme",
  name: "Acme Studios",
};

/** Sysadmin membership anchor — same pattern as publicstatus PLATFORM_TENANT. */
export const PLATFORM_TENANT: DemoTenant = {
  id: "00000000-0000-4000-8000-000000000099" as TenantId,
  tenantKey: "_platform",
  name: "Platform (sysadmin only)",
};

/** Shared sysadmin-seed shape for bin/main.ts (prod) + bin/server.ts (dev) — same
 *  membership/role wiring, only the credential source differs (env vs. dev const). */
export async function seedSysadmin(
  db: DbConnection,
  credentials: { readonly email: string; readonly password: string },
): Promise<void> {
  await seedAdmin(db, {
    email: credentials.email,
    password: credentials.password,
    displayName: "Sysadmin",
    globalRoles: ["SystemAdmin"],
    memberships: [
      {
        tenantId: PLATFORM_TENANT.id,
        tenantKey: PLATFORM_TENANT.tenantKey,
        tenantName: PLATFORM_TENANT.name,
        roles: ["User"],
      },
    ],
  });
}
