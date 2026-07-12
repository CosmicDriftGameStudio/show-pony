// Third attempt: prior seeds' parameterized unsafe() returned no rows on prod
// (warmup create ran, rooftop update silently skipped). Fail loud if missing.

import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import type { SeedMigration } from "@cosmicdrift/kumiko-framework/es-ops";

const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;

const ROOFTOP_DESC =
  "Join us on the 24th floor for cocktails, a live DJ set, and the Show Pony 2.0 launch at midnight. Dress code: rooftop-ready. Bring someone you'd introduce to the team.";

type RawSqlRunner = {
  readonly unsafe: (sql: string, params?: readonly unknown[]) => Promise<unknown>;
};

type EventRow = { id: string; version: number };

function toRawSqlRunner(db: unknown): RawSqlRunner {
  const candidate = db as Record<string, unknown>;
  if (typeof candidate["unsafe"] === "function") return db as RawSqlRunner;
  const raw = candidate["raw"] as Record<string, unknown> | undefined;
  if (raw && typeof raw["unsafe"] === "function") return raw as RawSqlRunner;
  throw new Error("rooftop-copy-patch: ctx.db exposes no raw .unsafe runner");
}

function asRows(result: unknown): EventRow[] {
  if (Array.isArray(result)) return result as EventRow[];
  if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: EventRow[] }).rows;
  }
  return [];
}

export default {
  description: "patch rooftop launch description (demo tenant)",
  run: async (ctx) => {
    const raw = toRawSqlRunner(ctx.db);
    const result = await raw.unsafe(
      `SELECT id, version FROM read_events
       WHERE tenant_id = '${DEMO_TENANT_ID}' AND slug = 'rooftop-launch'
       LIMIT 1`,
    );
    const rows = asRows(result);
    const rooftop = rows[0];
    if (!rooftop) {
      throw new Error(
        `rooftop-copy-patch: no event row (unsafe returned ${JSON.stringify(result)?.slice(0, 200) ?? "null"})`,
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
