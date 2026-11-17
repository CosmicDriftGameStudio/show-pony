import {
  access,
  defineWriteHandler,
  type HandlerContext,
} from "@cosmicdrift/kumiko-framework/engine";
import {
  failNotFound,
  UnprocessableError,
  writeFailure,
} from "@cosmicdrift/kumiko-framework/errors";
import { z } from "zod";
import { withStockCap } from "../cap-guard";
import { sendRsvpConfirmation } from "../lib/rsvp-confirmation-mail";
import { EVENT_FULL, GUEST_LIMIT_REACHED, RSVP_ALREADY_SUBMITTED } from "../rsvp-errors.shared";
import { type EventRow, findEventById } from "../schema/event";
import { RSVP_STATUSES, rsvpExecutor, rsvpTable } from "../schema/rsvp";

// pg_advisory_xact_lock namespace 'rsvp' (ASCII), disjoint from the cap guard's 'scap'.
const RSVP_EVENT_LOCK_NAMESPACE = 0x72737670;

export const rsvpSubmitSchema = z.object({
  eventId: z.uuid(),
  name: z.string().min(1).max(120),
  // Lowercased so the duplicate check and the stored address agree on one spelling.
  email: z.email().toLowerCase().optional(),
  status: z.enum(RSVP_STATUSES),
  plusN: z.number().int().min(0).max(20).default(0),
  note: z.string().max(500).optional(),
});

type RsvpSubmitPayload = z.infer<typeof rsvpSubmitSchema>;

async function confirmedSeats(ctx: HandlerContext, eventId: string): Promise<number> {
  const confirmed = { eventId, status: "yes" };
  const replies = await ctx.db.count(rsvpTable, confirmed);
  const [plusGuests] = await ctx.db.aggregate(
    rsvpTable,
    { measure: { fn: "sum", field: "plusN" } },
    confirmed,
  );
  return replies + (plusGuests?.value ?? 0);
}

async function rejectDuplicateOrOverbooking(
  ctx: HandlerContext,
  payload: RsvpSubmitPayload,
  event: EventRow,
) {
  if (payload.email !== undefined) {
    const existing = await ctx.db.fetchOne(rsvpTable, { eventId: event.id, email: payload.email });
    if (existing) {
      return writeFailure(
        new UnprocessableError(RSVP_ALREADY_SUBMITTED, {
          i18nKey: "showpony:errors.rsvpAlreadySubmitted",
          details: { field: "email" },
        }),
      );
    }
  }
  if (payload.status !== "yes" || event.guestLimit === null) return null;
  const taken = await confirmedSeats(ctx, event.id);
  const requested = 1 + payload.plusN;
  if (taken + requested <= event.guestLimit) return null;
  return writeFailure(
    new UnprocessableError(EVENT_FULL, {
      i18nKey: "showpony:errors.eventFull",
      details: {
        field: "rsvp",
        limit: event.guestLimit,
        remaining: Math.max(0, event.guestLimit - taken),
      },
    }),
  );
}

const rsvpSubmitBase = {
  name: "rsvp:submit",
  schema: rsvpSubmitSchema,
  access: { roles: [...access.anonymous], personalData: "public-intake" },
  rateLimit: { per: "ip+handler", limit: 20, windowSeconds: 60 },
  description:
    "Records a guest's reply to an event invite with name, attendance status (yes, no or maybe), number of additional guests and optional email and note; callable anonymously from the public invite page, rejected when the event does not belong to this tenant, a yes would exceed the event's guest limit counting additional guests, the email already replied to this event, or the plan's reply quota is reached, and sends a best-effort confirmation mail when an email is given.",
} as const;

// The cap guard takes the tenant-wide advisory lock before running its handler, so it must wrap
// only the insert: the event check below has to reject forged ids before anyone queues on the lock.
const cappedInsert = withStockCap(
  defineWriteHandler({
    ...rsvpSubmitBase,
    handler: (event, ctx) => rsvpExecutor.create(event.payload, event.user, ctx.db),
  }),
  {
    table: rsvpTable,
    limit: (caps) => caps.maxGuests,
    code: GUEST_LIMIT_REACHED,
    i18nKey: "showpony:errors.guestLimitReached",
    field: "rsvp",
  },
);

export const rsvpSubmitHandler = defineWriteHandler({
  ...rsvpSubmitBase,
  handler: async (event, ctx) => {
    // Lock order is per-event first, then the cap guard's tenant-wide lock; the event check runs before both so forged ids never queue.
    const found = await findEventById(ctx, event.payload.eventId);
    if (!found) return failNotFound("event", event.payload.eventId);
    await ctx.db.advisoryXactLock(RSVP_EVENT_LOCK_NAMESPACE, found.id);
    const rejection = await rejectDuplicateOrOverbooking(ctx, event.payload, found);
    if (rejection) return rejection;

    const result = await cappedInsert.handler({ ...event, prepared: undefined }, ctx);
    if (result.isSuccess) await sendRsvpConfirmation(ctx, event.payload, found);
    return result;
  },
});
