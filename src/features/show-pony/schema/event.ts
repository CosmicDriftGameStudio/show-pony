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
  fields: {
    title: createTextField({ required: true, sortable: true }),
    slug: createTextField({ required: true }),
    startsAt: createTimestampField({ required: true }),
    location: createTextField({}),
    // Host-authored public event copy — business data, not third-party PII.
    description: createLongTextField({
      personal: false,
      reason: "is_business_data",
    }),
    guestLimit: createNumberField({ sortable: true, integer: true, min: 0 }),
  },
});

export const eventTable = buildEntityTable("event", eventEntity);

// Only the columns findEvent's two callers read. selectMany still runs
// SELECT * (this type doesn't strip response columns — kumiko's query
// handlers don't strip output either), it just narrows what callers see.
type EventRow = { id: string; slug: string; title: string };

function selectAllEvents(ctx: HandlerContext) {
  return ctx.db.selectMany<EventRow>(eventTable);
}

// ponytail: O(n) scan over the tenant's events — fine for a handful per
// host; a slug/id-filter query is the scale-up. Shared by the two call
// sites that need "find one event by a predicate" (event:by-slug,
// rsvp-confirmation-mail) so they don't duplicate the scan-then-find.
export async function findEvent(
  ctx: HandlerContext,
  predicate: (row: EventRow) => boolean,
): Promise<EventRow | undefined> {
  const events = await selectAllEvents(ctx);
  return events.find(predicate);
}
