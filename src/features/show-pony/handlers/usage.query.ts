import { defineQueryHandler } from "@cosmicdrift/kumiko-framework/engine";
import { z } from "zod";
import { eventTable } from "../schema/event";
import { rsvpTable } from "../schema/rsvp";
import { resolveTierCaps } from "../tier-resolver";

export type CapUsage = {
  readonly used: number;
  readonly limit: number | null;
};

export type UsageInfo = {
  readonly events: CapUsage;
  readonly guests: CapUsage;
};

function capLimit(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

export const usageQuery = defineQueryHandler({
  name: "usage",
  schema: z.object({}),
  access: { roles: ["Admin"] },
  async handler(_event, ctx): Promise<UsageInfo> {
    const tenantId = ctx.user.tenantId;
    const caps = await resolveTierCaps(ctx.db, tenantId);
    const events = (await ctx.db.selectMany(eventTable, { tenantId })).length;
    const guests = (await ctx.db.selectMany(rsvpTable, { tenantId })).length;
    return {
      events: { used: events, limit: capLimit(caps.maxEvents) },
      guests: { used: guests, limit: capLimit(caps.maxGuests) },
    };
  },
});
