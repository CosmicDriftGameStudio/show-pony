// Move sysadmin off the demo host tenant onto the internal _platform tenant
// (publicstatus pattern). Platform operators log in with global SystemAdmin;
// they must not appear on Mira's Team screen or inherit tenant-admin on demo.

import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import type { SeedMigration } from "@cosmicdrift/kumiko-framework/es-ops";

const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;
const PLATFORM_TENANT_ID = "00000000-0000-4000-8000-000000000099" as TenantId;

const SYSADMIN_EMAILS = ["sysadmin@show-pony.local", "showpony-sysadmin@kumiko.rocks"] as const;

export default {
  description: "sysadmin: demo membership → _platform anchor tenant",
  run: async (ctx) => {
    const tenants = await ctx.findTenants();
    const platformExists = tenants.some((t) => t.id === PLATFORM_TENANT_ID);
    if (!platformExists) {
      await ctx.systemWriteAs(
        "tenant:write:create",
        { id: PLATFORM_TENANT_ID, key: "_platform", name: "Platform (sysadmin only)" },
        PLATFORM_TENANT_ID,
      );
    }

    for (const email of SYSADMIN_EMAILS) {
      const user = await ctx.findUserByEmail(email);
      if (!user) continue;

      const memberships = await ctx.findMembershipsOfUser(user.id);
      const onPlatform = memberships.some((m) => m.tenantId === PLATFORM_TENANT_ID);
      if (!onPlatform) {
        await ctx.systemWriteAs(
          "tenant:write:add-member",
          { userId: user.id, tenantId: PLATFORM_TENANT_ID, roles: ["User"] },
          PLATFORM_TENANT_ID,
        );
      }

      for (const m of memberships) {
        if (m.tenantId !== DEMO_TENANT_ID) continue;
        await ctx.systemWriteAs(
          "tenant:write:remove-member",
          { userId: user.id, tenantId: m.tenantId },
          m.streamTenantId,
        );
      }
    }
  },
} satisfies SeedMigration;
