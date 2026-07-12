// Prod accumulated ~100 duplicate "rooftop-launch" rows: the initial seed passed
// a fixed aggregate id, but entity create schemas strip `id` → every boot retry
// minted a fresh UUID. Slug is not unique-constrained on the event entity.

import type { SeedMigration } from "@cosmicdrift/kumiko-framework/es-ops";
import {
  DEMO_EVENT_ID,
  DEMO_TENANT_ID,
  findEventsBySlug,
  pickCanonicalEvent,
  toRawSqlRunner,
  WARMUP_EVENT_ID,
} from "./_demo-event-db";

async function dedupeSlug(
  ctx: Parameters<SeedMigration["run"]>[0],
  slug: string,
  preferredId: string,
): Promise<void> {
  const raw = toRawSqlRunner(ctx.db);
  const rows = await findEventsBySlug(raw, slug);
  const keep = pickCanonicalEvent(rows, preferredId);
  if (!keep || rows.length <= 1) return;

  for (const row of rows) {
    if (row.id === keep.id) continue;
    await ctx.systemWriteAs("showpony:write:event:delete", { id: row.id }, DEMO_TENANT_ID);
  }
}

export default {
  description: "dedupe demo rooftop-launch + warmup-drinks events (slug collision drift)",
  run: async (ctx) => {
    await dedupeSlug(ctx, "rooftop-launch", DEMO_EVENT_ID);
    await dedupeSlug(ctx, "warmup-drinks", WARMUP_EVENT_ID);
  },
} satisfies SeedMigration;


