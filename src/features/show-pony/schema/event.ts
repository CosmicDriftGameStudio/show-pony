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
    title: createTextField({ required: true, sortable: true, searchable: true }),
    slug: createTextField({ required: true, searchable: true }),
    startsAt: createTimestampField({ required: true }),
    location: createTextField({ searchable: true }),
    // Host-authored public event copy — business data, not third-party PII.
    description: createLongTextField({ allowPlaintext: "is-business-data" }),
    guestLimit: createNumberField({ sortable: true, integer: true }),
  },
});

export const eventTable = buildEntityTable("event", eventEntity);

function selectAllEvents(ctx: HandlerContext) {
  return ctx.db.selectMany(eventTable);
}

type EventRow = Awaited<ReturnType<typeof selectAllEvents>>[number];

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
