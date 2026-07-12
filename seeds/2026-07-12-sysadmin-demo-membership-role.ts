// Sysadmin had the same demo-tenant membership roles as the host (Admin +
// TenantAdmin) — confusing on the Team screen. Platform access comes from
// global SystemAdmin; demo-tenant membership is login-only (publicstatus pattern).

import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import type { SeedMigration } from "@cosmicdrift/kumiko-framework/es-ops";

const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;

const SYSADMIN_EMAILS = ["sysadmin@show-pony.local", "showpony-sysadmin@kumiko.rocks"] as const;

export default {
  description: "demo tenant: sysadmin membership → User (not Admin/TenantAdmin)",
  run: async (ctx) => {
    for (const email of SYSADMIN_EMAILS) {
      const user = await ctx.findUserByEmail(email);
      if (!user) continue;

      for (const m of await ctx.findMembershipsOfUser(user.id)) {
        if (m.tenantId !== DEMO_TENANT_ID) continue;
        if (m.roles.length === 1 && m.roles[0] === "User") continue;

        await ctx.systemWriteAs(
          "tenant:write:update-member-roles",
          {
            userId: user.id,
            tenantId: m.tenantId,
            roles: ["User"],
          },
          m.streamTenantId,
        );
      }
    }
  },
} satisfies SeedMigration;
