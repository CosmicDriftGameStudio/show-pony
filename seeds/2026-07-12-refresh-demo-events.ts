// Prod ran 2026-06-28 before the tutorial refresh — rooftop copy is short and
// Winter Warmup Drinks is missing. This one-shot migration aligns live demo
// content with the doc screenshots.

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
  throw new Error("refresh-demo-events: ctx.db exposes no raw .unsafe runner");
}

async function findEventBySlug(
  raw: RawSqlRunner,
  slug: string,
): Promise<EventRow | null> {
  const rows = (await raw.unsafe(
    `SELECT id, version FROM read_events
     WHERE tenant_id = $1 AND slug = $2
     LIMIT 1`,
    [DEMO_TENANT_ID, slug],
  )) as EventRow[];
  return rows[0] ?? null;
}

export default {
  description: "refresh demo rooftop copy + add Winter Warmup Drinks",
  run: async (ctx) => {
    const raw = toRawSqlRunner(ctx.db);

    const rooftop = await findEventBySlug(raw, "rooftop-launch");
    if (rooftop) {
      await ctx.systemWriteAs(
        "showpony:write:event:update",
        {
          id: rooftop.id,
          version: rooftop.version,
          changes: { description: ROOFTOP_DESC },
        },
        DEMO_TENANT_ID,
      );
    }

    const warmup = await findEventBySlug(raw, "warmup-drinks");
    if (!warmup) {
      await ctx.systemWriteAs(
        "showpony:write:event:create",
        {
          title: "Winter Warmup Drinks",
          slug: "warmup-drinks",
          startsAt: "2026-11-28T18:00:00.000Z",
          location: "Ground-floor bar",
          description:
            "Low-key pre-holiday drinks for the team and friends. No agenda — just show up.",
          guestLimit: 40,
        },
        DEMO_TENANT_ID,
      );
    }
  },
} satisfies SeedMigration;
