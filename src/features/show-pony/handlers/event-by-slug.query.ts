import { access, defineQueryHandler } from "@cosmicdrift/kumiko-framework/engine";
import { z } from "zod";
import { findEvent } from "../schema/event";

export const eventBySlugQuery = defineQueryHandler({
  name: "event:by-slug",
  schema: z.object({ slug: z.string().min(1).max(120) }),
  access: { roles: [...access.anonymous] },
  rateLimit: { per: "ip", limit: 60, windowSeconds: 60 },
  description:
    "Looks up one event of the current tenant by its public slug for the anonymous invite page and returns the host-authored event record, or null when no event has that slug.",
  handler: async (query, ctx) => {
    return (await findEvent(ctx, (row) => row.slug === query.payload.slug)) ?? null;
  },
});
