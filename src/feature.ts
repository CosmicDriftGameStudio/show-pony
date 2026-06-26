// show-pony — Event + RSVP als Kumiko-Feature.
//
// Schritt 1: der Host-Teil — `event`-Entity + CRUD-Handler.
// Schritt 2: das `rsvp`-Entity + host-seitige Read-Handler (Gästeliste).
// Der anonyme RSVP-Write (public surface) + Admin-Screens kommen in
// späteren Schritten. Tenant-Scoping, Audit und Multi-Tenant-Isolation
// kommen aus dem Framework-Default.

import { buildEntityTable, createEventStoreExecutor } from "@cosmicdrift/kumiko-framework/db";
import {
  access,
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
import { z } from "zod";

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

export const rsvpTable = buildEntityTable("rsvp", rsvpEntity);
const rsvpExecutor = createEventStoreExecutor(rsvpTable, rsvpEntity, { entityName: "rsvp" });

// Host-CRUD: openToAll = jeder eingeloggte User. Writes und Queries sind
// tenant-scoped — ein Host sieht und ändert nur die Events des eigenen
// Tenants, nie die eines fremden.
const hostAccess = { access: { openToAll: true } } as const;

// Public-Write-Schema: whitelistet exakt die Felder, die ein Gast setzen
// darf. status default "yes", plusN default 0, email/note optional.
const rsvpSubmitSchema = z.object({
  eventId: z.uuid(),
  name: z.string().min(1).max(120),
  email: z.email().optional(),
  status: z.enum(RSVP_STATUSES),
  plusN: z.number().int().min(0).max(20).default(0),
  note: z.string().max(500).optional(),
});

export const showPonyFeature = defineFeature("showpony", (r) => {
  r.entity("event", eventEntity);
  r.writeHandler(defineEntityCreateHandler("event", eventEntity, hostAccess));
  r.writeHandler(defineEntityUpdateHandler("event", eventEntity, hostAccess));
  r.writeHandler(defineEntityDeleteHandler("event", eventEntity, hostAccess));
  r.queryHandler(defineEntityListHandler("event", eventEntity, hostAccess));
  r.queryHandler(defineEntityDetailHandler("event", eventEntity, hostAccess));

  r.entity("rsvp", rsvpEntity);

  // Der Kern: anonymer, public RSVP-Write. roles=[anonymous] lässt
  // unauthentifizierte Gäste durch; der Tenant kommt NICHT aus dem Payload,
  // sondern aus der Subdomain (tenantResolver beim Boot) — derselbe Request
  // landet so deterministisch beim richtigen Host. Per-IP-Rate-Limit ist
  // Pflicht: alle anonymen Caller teilen user.id="anonymous", ein per-User-
  // Limit wäre ein einziger globaler Tap (der Boot-Validator lehnt das ab).
  r.writeHandler(
    "rsvp:submit",
    rsvpSubmitSchema,
    async (event, ctx) => rsvpExecutor.create(event.payload, event.user, ctx.db),
    {
      access: { roles: [...access.anonymous] },
      rateLimit: { per: "ip+handler", limit: 20, windowSeconds: 60 },
    },
  );

  // Gästeliste + Detail (host-read, tenant-scoped).
  r.queryHandler(defineEntityListHandler("rsvp", rsvpEntity, hostAccess));
  r.queryHandler(defineEntityDetailHandler("rsvp", rsvpEntity, hostAccess));
});
