import {
  defineEntityCreateHandler,
  defineEntityDeleteHandler,
  defineEntityDetailHandler,
  defineEntityListHandler,
  defineEntityUpdateHandler,
} from "@cosmicdrift/kumiko-framework/engine";
import { withStockCap } from "../cap-guard";
import { eventEntity, eventTable } from "../schema/event";

const hostAccess = { access: { openToAll: true } } as const;

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
