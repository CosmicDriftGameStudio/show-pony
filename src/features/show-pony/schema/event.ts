import { buildEntityTable } from "@cosmicdrift/kumiko-framework/db";
import {
  createEntity,
  createLongTextField,
  createNumberField,
  createTextField,
  createTimestampField,
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
    guestLimit: createNumberField({ sortable: true }),
  },
});

export const eventTable = buildEntityTable("event", eventEntity);
