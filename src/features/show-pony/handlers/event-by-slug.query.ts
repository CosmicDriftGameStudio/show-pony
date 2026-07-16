import { access, defineQueryHandler } from "@cosmicdrift/kumiko-framework/engine";
import { z } from "zod";
import { findEvent } from "../schema/event";

export const eventBySlugQuery = defineQueryHandler({
  name: "event:by-slug",
  schema: z.object({ slug: z.string().min(1).max(120) }),
  access: { roles: [...access.anonymous] },
  handler: async (query, ctx) => {
    return (await findEvent(ctx, (row) => row.slug === query.payload.slug)) ?? null;
  },
});
