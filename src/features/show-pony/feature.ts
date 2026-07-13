// show-pony — event + RSVP feature (server registration only).

import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import {
  defineEntityDetailHandler,
  defineEntityListHandler,
  defineFeature,
} from "@cosmicdrift/kumiko-framework/engine";
import { billingInfoQuery } from "./handlers/billing-info.query";
import { eventBySlugQuery } from "./handlers/event-by-slug.query";
import {
  eventCreateHandler,
  eventDeleteHandler,
  eventDetailHandler,
  eventListHandler,
  eventUpdateHandler,
} from "./handlers/event-handlers";
import { rsvpSubmitHandler } from "./handlers/rsvp-submit.write";
import { usageQuery } from "./handlers/usage.query";
import { showPonyTranslations } from "./i18n";
import { registerShowPonyNav } from "./register/nav";
import { registerShowPonyScreens } from "./register/screens";
import { eventEntity, rsvpEntity } from "./schema";

const hostAccess = { access: { openToAll: true } } as const;

export { eventEntity, rsvpEntity, rsvpTable } from "./schema";

export const showPonyFeature = defineFeature("showpony", (r) => {
  r.requires(mailFoundationFeature.name);

  r.translations({ keys: showPonyTranslations });

  r.entity("event", eventEntity);
  r.writeHandler(eventCreateHandler);
  r.writeHandler(eventUpdateHandler);
  r.writeHandler(eventDeleteHandler);
  r.queryHandler(eventListHandler);
  r.queryHandler(eventDetailHandler);

  r.queryHandler(eventBySlugQuery);

  r.entity("rsvp", rsvpEntity);
  r.writeHandler(rsvpSubmitHandler);

  r.queryHandler(defineEntityListHandler("rsvp", rsvpEntity, hostAccess));
  r.queryHandler(defineEntityDetailHandler("rsvp", rsvpEntity, hostAccess));

  r.queryHandler(billingInfoQuery);
  r.queryHandler(usageQuery);

  registerShowPonyScreens(r);
  registerShowPonyNav(r);
});
