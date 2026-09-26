import {
  defineEntityCreateHandler,
  defineEntityDeleteHandler,
  defineEntityDetailHandler,
  defineEntityListHandler,
  defineEntityUpdateHandler,
} from "@cosmicdrift/kumiko-framework/engine";
import { withStockCap } from "../cap-guard";
import { eventEntity, eventTable } from "../schema/event";

// Events carry no guest PII (description is explicitly personal: false), so
// the risk here is destruction, not confidentiality — any tenant member
// editing or deleting another member's event. Writes are Admin-only, the
// same role rsvp/billing/usage already gate on; reads stay open since
// they're harmless and needed to use the app.
const hostWriteAccess = { access: { roles: ["Admin"] } } as const;
const hostReadAccess = {
  access: {
    openToAll: {
      reason:
        "any signed-in member of the tenant may view this tenant's events — show-pony has no " +
        "per-user event ownership or organizer role yet, and reading events carries no " +
        "confidentiality risk",
    },
  },
} as const;

export const eventCreateHandler = withStockCap(
  defineEntityCreateHandler("event", eventEntity, {
    ...hostWriteAccess,
    description:
      "Creates an event for the tenant with title, public slug, start time and optional location, description and guest limit; Admin only, rejected with upgrade_required once the plan tier's event limit is reached.",
  }),
  {
    table: eventTable,
    limit: (caps) => caps.maxEvents,
    code: "upgrade_required",
    i18nKey: "showpony:errors.eventLimitReached",
    field: "event",
  },
);

export const eventUpdateHandler = defineEntityUpdateHandler("event", eventEntity, {
  ...hostWriteAccess,
  description:
    "Changes fields of an existing event (title, slug, start time, location, description, guest limit) against its current version; Admin only.",
});
export const eventDeleteHandler = defineEntityDeleteHandler("event", eventEntity, {
  ...hostWriteAccess,
  description: "Deletes one event of the tenant by id; Admin only.",
});
export const eventListHandler = defineEntityListHandler("event", eventEntity, {
  ...hostReadAccess,
  description:
    "Lists the tenant's events with title, slug, start time, location and guest limit; open to every signed-in member of the tenant.",
});
export const eventDetailHandler = defineEntityDetailHandler("event", eventEntity, {
  ...hostReadAccess,
  description:
    "Reads one event of the tenant by id with title, slug, start time, location, description and guest limit; open to every signed-in member of the tenant.",
});
