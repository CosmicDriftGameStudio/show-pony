import { access, defineWriteHandler } from "@cosmicdrift/kumiko-framework/engine";
import { withStockCap } from "../cap-guard";
import { GUEST_LIMIT_REACHED } from "../rsvp-errors.shared";
import { rsvpExecutor, rsvpTable } from "../schema/rsvp";
import { rsvpSubmitSchema } from "../schema/rsvp-submit";

// The cap guard takes the tenant-wide advisory lock before running its handler, so it must wrap
// only the insert: rsvp:submit's event check has to reject forged ids before anyone queues on the lock.
// Not registered: rsvp:submit calls it in-process after its own checks.
export const rsvpCappedInsertHandler = withStockCap(
  defineWriteHandler({
    name: "rsvp:submit",
    schema: rsvpSubmitSchema,
    access: { roles: [...access.anonymous], personalData: "public-intake" },
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
