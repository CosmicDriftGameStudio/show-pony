// show-pony — event + RSVP as a single Kumiko feature.
//
// A host manages events (CRUD + dashboard screens); an anonymous guest RSVPs
// through the public surface (rsvp:submit). Tenant-scoping, audit, and
// multi-tenant isolation all come from the framework default.

import {
  createTransportForTenant,
  mailFoundationFeature,
} from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { escapeHtml } from "@cosmicdrift/kumiko-headless";
import { buildEntityTable, createEventStoreExecutor } from "@cosmicdrift/kumiko-framework/db";
import {
  access,
  createEntity,
  createLongTextField,
  createNumberField,
  createSelectField,
  createTextField,
  createTimestampField,
  defineEntityDetailHandler,
  defineEntityListHandler,
  defineFeature,
  type HandlerContext,
  registerEntityCrud,
  type TenantId,
} from "@cosmicdrift/kumiko-framework/engine";
import type {
  EntityEditScreenDefinition,
  EntityListScreenDefinition,
} from "@cosmicdrift/kumiko-framework/ui-types";
import { z } from "zod";
import { showPonyTranslationKeys } from "./i18n";

// The event slug is unique per tenant (tenant-scoping is enough): the public
// URL is <host>.show-pony.<domain>/e/<slug>, and the host comes from the
// subdomain — so the slug only has to be collision-free within one tenant,
// not globally.
export const eventEntity = createEntity({
  fields: {
    title: createTextField({ required: true, sortable: true, searchable: true }),
    slug: createTextField({ required: true, searchable: true }),
    startsAt: createTimestampField({ required: true }),
    location: createTextField({ searchable: true }),
    // Host-authored public event copy — business data, not third-party PII.
    description: createLongTextField({ allowPlaintext: "is-business-data" }),
    guestLimit: createNumberField({ sortable: true }),
  },
});

export const RSVP_STATUSES = ["yes", "no", "maybe"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

// RSVP: arrives through the anonymous public write. name is required, email
// optional (only for the confirmation mail). plusN = extra guests, status =
// coming / not coming / maybe. eventId references the event within the same
// tenant.
export const rsvpEntity = createEntity({
  fields: {
    eventId: createTextField({ required: true, searchable: true }),
    // Guest-submitted personal data (collected anonymously). Searchable/sortable
    // guest-list lookup is a core feature here, which structurally conflicts with
    // `pii: true` (encrypted fields can't be searched/sorted) — declared plaintext
    // instead, same pattern as `note` below.
    name: createTextField({
      required: true,
      sortable: true,
      searchable: true,
      allowPlaintext: "guest-list search/sort, no KMS provisioned",
    }),
    email: createTextField({
      searchable: true,
      allowPlaintext: "guest-list search, no KMS provisioned",
    }),
    status: createSelectField({ options: RSVP_STATUSES, default: "yes", filterable: true }),
    plusN: createNumberField({ sortable: true }),
    // Free text from an anonymous submitter — no user FK, so userOwned can't
    // apply; declare it plaintext business input with an explicit reason.
    note: createLongTextField({ allowPlaintext: "anonymous-guest-input" }),
  },
});

export const eventTable = buildEntityTable("event", eventEntity);
export const rsvpTable = buildEntityTable("rsvp", rsvpEntity);
const rsvpExecutor = createEventStoreExecutor(rsvpTable, rsvpEntity, { entityName: "rsvp" });

// Host CRUD: openToAll = any signed-in user. Writes and queries are
// tenant-scoped — a host only sees and edits their own tenant's events, never
// another's.
const hostAccess = { access: { openToAll: true } } as const;

// Public write schema: whitelists exactly the fields a guest may set. status
// defaults to "yes", plusN to 0, email/note optional.
const rsvpSubmitSchema = z.object({
  eventId: z.uuid(),
  name: z.string().min(1).max(120),
  email: z.email().optional(),
  status: z.enum(RSVP_STATUSES),
  plusN: z.number().int().min(0).max(20).default(0),
  note: z.string().max(500).optional(),
});

const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  yes: "Coming",
  no: "Not coming",
  maybe: "Maybe",
};

// The guest name and event title go into a mail's HTML body — both are
// untrusted (the name is anonymous public input). Escape before interpolating,
// or the confirmation becomes an HTML/script-injection vector.
function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Best-effort confirmation mail to the guest (only when they gave an email).
// mail-foundation DIRECTLY, not delivery: delivery is user-centric
// (recipient = userId → email lookup), and our guest is anonymous, addressable
// only by the email they just typed — the low-level transport is the fit.
async function sendRsvpConfirmation(
  ctx: HandlerContext,
  tenantId: TenantId,
  payload: z.infer<typeof rsvpSubmitSchema>,
): Promise<void> {
  if (!payload.email) return;
  const events = await ctx.db.selectMany(eventTable);
  const found = events.find((e) => e.id === payload.eventId)?.title;
  const title = typeof found === "string" ? found : "your event";
  const transport = await createTransportForTenant(ctx, tenantId, "showpony:write:rsvp:submit");
  await transport.send({
    to: payload.email,
    subject: `Your RSVP for "${title}"`,
    html:
      `<p>Hi ${escapeHtml(payload.name)},</p>` +
      `<p>your reply (<strong>${RSVP_STATUS_LABELS[payload.status]}</strong>) for ` +
      `"${escapeHtml(title)}" is in. Thanks!</p>`,
  });
}

// Host dashboard: schema-driven screens. entityList/entityEdit are rendered
// generically by the framework from the entity — no custom React per screen.
// Labels are i18n keys (src/i18n.ts), resolved by the client feature
// (src/web.ts).
export const eventListScreen: EntityListScreenDefinition = {
  id: "event-list",
  type: "entityList",
  entity: "event",
  columns: ["title", "slug", "startsAt", "location", "guestLimit"],
  pageSize: 25,
  defaultSort: { field: "title", dir: "asc" },
  rowActions: [{ kind: "navigate", id: "edit", label: "actions.edit", screen: "event-edit" }],
};

export const eventEditScreen: EntityEditScreenDefinition = {
  id: "event-edit",
  type: "entityEdit",
  entity: "event",
  layout: {
    sections: [
      {
        title: "showpony:section.event-basics",
        columns: 2,
        fields: [{ field: "title", span: 2 }, "slug", "startsAt", "location", "guestLimit"],
      },
      { title: "showpony:section.event-details", columns: 1, fields: ["description"] },
    ],
  },
};

export const rsvpListScreen: EntityListScreenDefinition = {
  id: "rsvp-list",
  type: "entityList",
  entity: "rsvp",
  columns: ["name", "status", "plusN", "email"],
  pageSize: 50,
  defaultSort: { field: "name", dir: "asc" },
};

export const showPonyFeature = defineFeature("showpony", (r) => {
  r.requires(mailFoundationFeature.name);
  r.translations({ keys: showPonyTranslationKeys });

  r.entity("event", eventEntity);
  registerEntityCrud(r, "event", eventEntity, { write: hostAccess, read: hostAccess });

  // Public: an anonymous visitor loads the event by its slug. Tenant-scoped via
  // the resolver (Host header) — the same slug on another subdomain is a
  // different event.
  r.queryHandler(
    "event:by-slug",
    z.object({ slug: z.string().min(1).max(120) }),
    // ponytail: O(n) scan over the tenant's events — fine for a handful per
    // host; a slug-filter query is the scale-up.
    async (e, ctx) => {
      const events = await ctx.db.selectMany(eventTable);
      return events.find((row) => row.slug === e.payload.slug) ?? null;
    },
    { access: { roles: [...access.anonymous] } },
  );

  r.entity("rsvp", rsvpEntity);

  // The core: the anonymous, public RSVP write. roles=[anonymous] lets
  // unauthenticated guests through; the tenant does NOT come from the payload
  // but from the subdomain (the tenantResolver at boot) — so the same request
  // lands deterministically on the right host. The per-IP rate limit is
  // mandatory: every anonymous caller shares user.id="anonymous", so a per-user
  // limit would be one global tap (the boot validator rejects that).
  r.writeHandler(
    "rsvp:submit",
    rsvpSubmitSchema,
    async (event, ctx) => {
      const result = await rsvpExecutor.create(event.payload, event.user, ctx.db);
      // The mail is best-effort — a transport error must not fail the RSVP.
      await sendRsvpConfirmation(ctx, event.user.tenantId, event.payload).catch(() => undefined);
      return result;
    },
    {
      access: { roles: [...access.anonymous] },
      rateLimit: { per: "ip+handler", limit: 20, windowSeconds: 60 },
    },
  );

  // Guest list + detail (host read, tenant-scoped).
  r.queryHandler(defineEntityListHandler("rsvp", rsvpEntity, hostAccess));
  r.queryHandler(defineEntityDetailHandler("rsvp", rsvpEntity, hostAccess));

  r.screen(eventListScreen);
  r.screen(eventEditScreen);
  r.screen(rsvpListScreen);
  r.nav({
    id: "events",
    label: "showpony:nav.events",
    order: 10,
    screen: "showpony:screen:event-list",
  });
  r.nav({
    id: "event-new",
    label: "showpony:nav.event-new",
    parent: "showpony:nav:events",
    screen: "showpony:screen:event-edit",
    order: 10,
  });
  r.nav({
    id: "guests",
    label: "showpony:nav.guests",
    order: 20,
    screen: "showpony:screen:rsvp-list",
  });
});


