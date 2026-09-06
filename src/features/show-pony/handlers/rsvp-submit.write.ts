import { access, defineWriteHandler } from "@cosmicdrift/kumiko-framework/engine";
import { failNotFound } from "@cosmicdrift/kumiko-framework/errors";
import { z } from "zod";
import { checkStockCap } from "../cap-guard";
import { sendRsvpConfirmation } from "../lib/rsvp-confirmation-mail";
import { findEvent } from "../schema/event";
import { RSVP_STATUSES, rsvpExecutor, rsvpTable } from "../schema/rsvp";

export const rsvpSubmitSchema = z.object({
  eventId: z.uuid(),
  name: z.string().min(1).max(120),
  email: z.email().optional(),
  status: z.enum(RSVP_STATUSES),
  plusN: z.number().int().min(0).max(20).default(0),
  note: z.string().max(500).optional(),
});

export const rsvpSubmitHandler = defineWriteHandler({
  name: "rsvp:submit",
  schema: rsvpSubmitSchema,
  access: { roles: [...access.anonymous] },
  rateLimit: { per: "ip+handler", limit: 20, windowSeconds: 60 },
  handler: async (event, ctx) => {
    // Anonymous handler: eventId is only shape-checked (z.uuid()) by the
    // schema, so a forged/foreign UUID would otherwise pass through to
    // capacity checks and confirmation mail; ctx.db is tenant-scoped so
    // this also rejects a real event id from another tenant.
    const found = await findEvent(ctx, (row) => row.id === event.payload.eventId);
    if (!found) return failNotFound("event", event.payload.eventId);

    const capFailure = await checkStockCap(ctx.db.raw, event.user.tenantId, {
      table: rsvpTable,
      limit: (caps) => caps.maxGuests,
      code: "guest_limit_reached",
      i18nKey: "showpony:errors.guestLimitReached",
      field: "rsvp",
    });
    if (capFailure) return capFailure;

    const result = await rsvpExecutor.create(event.payload, event.user, ctx.db);
    // The mail is best-effort — a transport error must not fail the RSVP.
    await sendRsvpConfirmation(ctx, event.user.tenantId, event.payload).catch(() => undefined);
    return result;
  },
});
