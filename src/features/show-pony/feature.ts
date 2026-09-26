// show-pony — event + RSVP feature (server registration only).

import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import {
  defineEntityDetailHandler,
  defineEntityListHandler,
  defineFeature,
} from "@cosmicdrift/kumiko-framework/engine";
import { eventBySlugQuery } from "./handlers/event-by-slug.query";
import {
  eventCreateHandler,
  eventDeleteHandler,
  eventDetailHandler,
  eventListHandler,
  eventUpdateHandler,
} from "./handlers/event-handlers";
import { inviteBrandingQuery } from "./handlers/invite-branding.query";
import { rsvpSubmitHandler } from "./handlers/rsvp-submit.write";
import { usageQuery } from "./handlers/usage.query";
import { showPonyTranslations } from "./i18n";
import { INVITE_BRANDING_KEYS } from "./invite-branding";
import { registerShowPonyNav } from "./register/nav";
import { registerShowPonyScreens } from "./register/screens";
import { eventEntity, rsvpEntity } from "./schema";

// RSVP rows carry guest PII (name/email/note) — unlike event CRUD, this is
// restricted to Admin rather than openToAll: show-pony has no dedicated
// organizer role yet, and Admin is the same privileged role billing and
// usage already gate on.
const rsvpReadAccess = { access: { roles: ["Admin"] } } as const;

export { eventEntity, rsvpEntity, rsvpTable } from "./schema";

export const showPonyFeature = defineFeature("showpony", (r) => {
  r.requires(mailFoundationFeature.name, "config", "managed-pages");

  r.config({ keys: INVITE_BRANDING_KEYS });

  r.translations({ keys: showPonyTranslations });

  r.entity("event", eventEntity);
  r.writeHandler(eventCreateHandler);
  r.writeHandler(eventUpdateHandler);
  r.writeHandler(eventDeleteHandler);
  r.queryHandler(eventListHandler);
  r.queryHandler(eventDetailHandler);

  r.queryHandler(eventBySlugQuery);
  r.queryHandler(inviteBrandingQuery);

  r.entity("rsvp", rsvpEntity);
  r.writeHandler(rsvpSubmitHandler);

  r.queryHandler(
    defineEntityListHandler("rsvp", rsvpEntity, {
      ...rsvpReadAccess,
      description:
        "Lists the tenant's guest replies with name, email, attendance status (yes, no or maybe) and number of additional guests; Admin only, because the rows carry guest personal data.",
    }),
  );
  r.queryHandler(
    defineEntityDetailHandler("rsvp", rsvpEntity, {
      ...rsvpReadAccess,
      description:
        "Reads one guest reply by id with the guest's name, email, note, attendance status (yes, no or maybe) and number of additional guests; Admin only, because these fields are guest personal data.",
    }),
  );

  r.queryHandler(usageQuery);

  registerShowPonyScreens(r);
  registerShowPonyNav(r);
});
