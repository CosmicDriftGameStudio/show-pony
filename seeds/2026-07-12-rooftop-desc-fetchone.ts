// Patch rooftop description by fixed aggregate id — no parameterized unsafe()
// (prod runner returned empty rows for $1/$2 binds). Fail loud if missing.

import { fetchOne } from "@cosmicdrift/kumiko-framework/db";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import type { SeedMigration } from "@cosmicdrift/kumiko-framework/es-ops";
import { eventTable } from "../src/features/show-pony/schema/event";

const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;
const DEMO_EVENT_ID = "00000000-0000-4000-8000-0000000000e1";

const ROOFTOP_DESC =
  "Join us on the 24th floor for cocktails, a live DJ set, and the Show Pony 2.0 launch at midnight. Dress code: rooftop-ready. Bring someone you'd introduce to the team.";

export default {
  description: "patch rooftop launch description via fetchOne (demo tenant)",
  run: async (ctx) => {
    const rooftop = await fetchOne<{ id: string; version: number }>(ctx.db, eventTable, {
      id: DEMO_EVENT_ID,
      tenantId: DEMO_TENANT_ID,
    });
    if (!rooftop) {
      throw new Error(
        `rooftop-desc-fetchone: event ${DEMO_EVENT_ID} missing on tenant ${DEMO_TENANT_ID}`,
      );
    }

    await ctx.systemWriteAs(
      "showpony:write:event:update",
      {
        id: rooftop.id,
        version: rooftop.version,
        changes: { description: ROOFTOP_DESC },
      },
      DEMO_TENANT_ID,
    );
  },
} satisfies SeedMigration;
