// show-pony — Event + RSVP als Kumiko-Feature.
//
// Schritt 1: der Host-Teil — `event`-Entity + CRUD-Handler.
// Schritt 2: das `rsvp`-Entity + host-seitige Read-Handler (Gästeliste).
// Der anonyme RSVP-Write (public surface) + Admin-Screens kommen in
// späteren Schritten. Tenant-Scoping, Audit und Multi-Tenant-Isolation
// kommen aus dem Framework-Default.

import {
  createEntity,
  createLongTextField,
  createNumberField,
  createSelectField,
  createTextField,
  createTzField,
  defineEntityCreateHandler,
  defineEntityDeleteHandler,
  defineEntityDetailHandler,
  defineEntityListHandler,
  defineEntityUpdateHandler,
  defineFeature,
} from "@cosmicdrift/kumiko-framework/engine";

// Event-Slug ist per-Tenant eindeutig (Tenant-Scoping reicht): die public
// URL wird <host>.show-pony.<domain>/e/<slug>, der Host kommt aus der
// Subdomain — der Slug muss also nur innerhalb des Tenants kollisionsfrei
// sein, nicht global.
export const eventEntity = createEntity({
  fields: {
    title: createTextField({ required: true, sortable: true, searchable: true }),
    slug: createTextField({ required: true, searchable: true }),
    startsAt: createTzField({ required: true }),
    location: createTextField({ searchable: true }),
    description: createLongTextField(),
    guestLimit: createNumberField({ sortable: true }),
  },
});

export const RSVP_STATUSES = ["yes", "no", "maybe"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

// RSVP: kommt im MVP über den anonymen public-Write rein (Schritt 3).
// name ist Pflicht, email optional (nur für die Bestätigungs-Mail).
// plusN = Begleitpersonen, status = Zu-/Absage/Vielleicht. eventId
// referenziert das Event innerhalb desselben Tenants.
export const rsvpEntity = createEntity({
  fields: {
    eventId: createTextField({ required: true, searchable: true }),
    name: createTextField({ required: true, sortable: true, searchable: true }),
    email: createTextField({ searchable: true }),
    status: createSelectField({ options: RSVP_STATUSES, default: "yes", filterable: true }),
    plusN: createNumberField({ sortable: true }),
    note: createLongTextField(),
  },
});

// Host-CRUD: openToAll = jeder eingeloggte User. Writes und Queries sind
// tenant-scoped — ein Host sieht und ändert nur die Events des eigenen
// Tenants, nie die eines fremden.
const hostAccess = { access: { openToAll: true } } as const;

export const showPonyFeature = defineFeature("showpony", (r) => {
  r.entity("event", eventEntity);
  r.writeHandler(defineEntityCreateHandler("event", eventEntity, hostAccess));
  r.writeHandler(defineEntityUpdateHandler("event", eventEntity, hostAccess));
  r.writeHandler(defineEntityDeleteHandler("event", eventEntity, hostAccess));
  r.queryHandler(defineEntityListHandler("event", eventEntity, hostAccess));
  r.queryHandler(defineEntityDetailHandler("event", eventEntity, hostAccess));

  // RSVP host-read: Gästeliste + Detail. Der anonyme Submit-Write kommt
  // in Schritt 3 dazu.
  r.entity("rsvp", rsvpEntity);
  r.queryHandler(defineEntityListHandler("rsvp", rsvpEntity, hostAccess));
  r.queryHandler(defineEntityDetailHandler("rsvp", rsvpEntity, hostAccess));
});
