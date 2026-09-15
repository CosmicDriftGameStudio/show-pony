import {
  defineEntityCreateHandler,
  defineEntityDeleteHandler,
  defineEntityDetailHandler,
  defineEntityListHandler,
  defineEntityUpdateHandler,
} from "@cosmicdrift/kumiko-framework/engine";
import { withStockCap } from "../cap-guard";
import { eventEntity, eventTable } from "../schema/event";

const hostAccess = {
  access: {
    openToAll: {
      reason:
        "any signed-in member of the tenant may create, edit, delete and view this tenant's " +
        "events — show-pony has no per-user event ownership or organizer role yet, every " +
        "signed-in member acts as a host",
    },
  },
} as const;

export const eventCreateHandler = withStockCap(
  defineEntityCreateHandler("event", eventEntity, hostAccess),
  {
    table: eventTable,
    limit: (caps) => caps.maxEvents,
    code: "upgrade_required",
    i18nKey: "showpony:errors.eventLimitReached",
    field: "event",
  },
);

export const eventUpdateHandler = defineEntityUpdateHandler("event", eventEntity, hostAccess);
export const eventDeleteHandler = defineEntityDeleteHandler("event", eventEntity, hostAccess);
export const eventListHandler = defineEntityListHandler("event", eventEntity, hostAccess);
export const eventDetailHandler = defineEntityDetailHandler("event", eventEntity, hostAccess);
