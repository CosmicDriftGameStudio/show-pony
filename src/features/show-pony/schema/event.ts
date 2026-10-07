import { buildEntityTable } from "@cosmicdrift/kumiko-framework/db";
import {
  createEntity,
  createLongTextField,
  createNumberField,
  createTextField,
  createTimestampField,
  type HandlerContext,
} from "@cosmicdrift/kumiko-framework/engine";

// The event slug is unique per tenant (tenant-scoping is enough): the public
// URL is <host>.show-pony.<domain>/e/<slug>, and the host comes from the
// subdomain — so the slug only has to be collision-free within one tenant,
// not globally.
export const eventEntity = createEntity({
  description:
    "One event a tenant hosts: title, a slug that forms the public invite link within the tenant's subdomain, start time, optional location, description and guest limit. The host-authored fields are public invite-page copy, not personal data.",
  fields: {
    title: createTextField({
      required: true,
      sortable: true,
      searchable: true,
      personal: false,
      reason: "is_business_data",
    }),
    slug: createTextField({
      required: true,
      personal: false,
      reason: "technical_reference",
    }),
    startsAt: createTimestampField({ required: true }),
    location: createTextField({ searchable: true, personal: false, reason: "is_business_data" }),
    // Host-authored public event copy, like title/slug/location above —
    // event:by-slug serves it to anonymous visitors by design.
    description: createLongTextField({
      personal: false,
      reason: "is_business_data",
    }),
    guestLimit: createNumberField({ sortable: true, integer: true, min: 0 }),
  },
});

export const eventTable = buildEntityTable("event", eventEntity);

// Only the columns the callers read. fetchOne still runs SELECT * (kumiko's
// query handlers don't strip output either), it just narrows what callers see.
export type EventRow = { id: string; slug: string; title: string };

export function findEventById(ctx: HandlerContext, id: string): Promise<EventRow | undefined> {
  return ctx.db.fetchOne<EventRow>(eventTable, { id });
}

export function findEventBySlug(ctx: HandlerContext, slug: string): Promise<EventRow | undefined> {
  return ctx.db.fetchOne<EventRow>(eventTable, { slug });
}
