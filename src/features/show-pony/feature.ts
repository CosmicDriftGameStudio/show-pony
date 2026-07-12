// show-pony — event + RSVP feature (server registration only).

import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import {
  defineEntityDetailHandler,
  defineEntityListHandler,
  defineFeature,
  registerEntityCrud,
} from "@cosmicdrift/kumiko-framework/engine";
import { eventBySlugQuery } from "./handlers/event-by-slug.query";
import { rsvpSubmitHandler } from "./handlers/rsvp-submit.write";
import { showPonyTranslations } from "./i18n";
import { registerShowPonyNav } from "./register/nav";
import { eventEditScreen, eventListScreen, rsvpListScreen } from "./register/screens";
import { eventEntity, rsvpEntity } from "./schema";

const hostAccess = { access: { openToAll: true } } as const;

export { eventEntity, rsvpEntity, rsvpTable } from "./schema";

export const showPonyFeature = defineFeature("showpony", (r) => {
  r.requires(mailFoundationFeature.name);
  r.translations({ keys: showPonyTranslations });

  r.entity("event", eventEntity);
  registerEntityCrud(r, "event", eventEntity, { write: hostAccess, read: hostAccess });

  r.queryHandler(eventBySlugQuery);

  r.entity("rsvp", rsvpEntity);
  r.writeHandler(rsvpSubmitHandler);

  r.queryHandler(defineEntityListHandler("rsvp", rsvpEntity, hostAccess));
  r.queryHandler(defineEntityDetailHandler("rsvp", rsvpEntity, hostAccess));

  r.screen(eventListScreen);
  r.screen(eventEditScreen);
  r.screen(rsvpListScreen);
  registerShowPonyNav(r);
});
