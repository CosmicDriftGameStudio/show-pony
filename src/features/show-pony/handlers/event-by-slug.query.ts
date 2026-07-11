import { access, defineQueryHandler } from "@cosmicdrift/kumiko-framework/engine";
import { z } from "zod";
import { eventTable } from "../schema/event";

export const eventBySlugQuery = defineQueryHandler({
  name: "event:by-slug",
  schema: z.object({ slug: z.string().min(1).max(120) }),
  access: { roles: [...access.anonymous] },
  handler: async (query, ctx) => {
    // ponytail: O(n) scan over the tenant's events — fine for a handful per
    // host; a slug-filter query is the scale-up.
    const events = await ctx.db.selectMany(eventTable);
    return events.find((row) => row.slug === query.payload.slug) ?? null;
  },
});
