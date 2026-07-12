// Demo tenants for show-pony — shared by bin/server.ts and bin/main.ts.
//
// demo: Mira's host tenant (events, guest list, public subdomain).
// _platform: internal anchor for sysadmin login only — not a customer subdomain.

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

/** Sysadmin membership anchor — same pattern as publicstatus PLATFORM_TENANT. */
export const PLATFORM_TENANT: DemoTenant = {
  id: "00000000-0000-4000-8000-000000000099" as TenantId,
  tenantKey: "_platform",
  name: "Platform (sysadmin only)",
};
