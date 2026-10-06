// Demo identity for the tutorial screenshots and loops: the shell shows the
// tenant name, the host's display name and email, which would otherwise read
// "Test Tenant <id>" / "Seed <id>" / "user-<uuid>@example.test".
// user:create's email uniqueness is global, so the seeded email carries the
// tenant id and is swapped for DEMO_HOST_PRESENTED_EMAIL at capture time.
import type { E2eSeededTenant, PresentIdentity, SeedTenantFixture } from "@cosmicdrift/kumiko-testing/e2e";

export const DEMO_TENANT_NAME = "Demo Host";
export const DEMO_HOST_PRESENTED_EMAIL = "host@show-pony.local";

const DEMO_HOST_IDENTITY = {
  displayName: "Show-Pony Host",
  email: "host-{tenantId}@show-pony.example",
} as const;

// show-pony gates its own writes on "Admin"; TenantAdmin alone is the framework role.
const HOST_ROLES = ["Admin", "TenantAdmin"] as const;

export type DemoHost = Awaited<ReturnType<E2eSeededTenant["addUser"]>>;

export interface DemoHostTenant {
  readonly tenant: E2eSeededTenant;
  readonly host: DemoHost;
  readonly identities: readonly PresentIdentity[];
}

export async function seedDemoHostTenant(seedTenant: SeedTenantFixture): Promise<DemoHostTenant> {
  const tenant = await seedTenant({ name: DEMO_TENANT_NAME });
  const host = await tenant.addUser(HOST_ROLES, DEMO_HOST_IDENTITY);
  return { tenant, host, identities: [{ from: host.email, to: DEMO_HOST_PRESENTED_EMAIL }] };
}
