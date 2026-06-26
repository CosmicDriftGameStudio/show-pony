// show-pony — Event + RSVP als Kumiko-Feature.
//
// Schritt 1: der Host-Teil. Ein `event`-Entity mit CRUD-Handlern.
// Tenant-Scoping, Audit und Multi-Tenant-Isolation kommen aus dem
// Framework-Default. Der anonyme RSVP-Write (public surface) +
// Admin-Screens kommen in späteren Schritten.

import {
  createEntity,
  createLongTextField,
  createNumberField,
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
});
