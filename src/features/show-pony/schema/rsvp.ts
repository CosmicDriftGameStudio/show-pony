import { buildEntityTable, createEventStoreExecutor } from "@cosmicdrift/kumiko-framework/db";
import {
  createEntity,
  createLongTextField,
  createNumberField,
  createSelectField,
  createTextField,
} from "@cosmicdrift/kumiko-framework/engine";

export const RSVP_STATUSES = ["yes", "no", "maybe"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

// RSVP: arrives through the anonymous public write. name is required, email
// optional (only for the confirmation mail). plusN = extra guests, status =
// coming / not coming / maybe. eventId references the event within the same
// tenant.
export const rsvpEntity = createEntity({
  fields: {
    eventId: createTextField({ required: true }),
    // Guest PII — personal: "self" so subject-key KMS can encrypt at rest and
    // crypto-shredding:write:forget-subject can erase the key. find fuzzy/exact
    // is allowed with a subject annotation since fw#1610 (search decrypts into
    // a derived Meili index that purge-subject clears on key erase). sortable
    // stays forbidden on annotated fields — guest-list lookup is search-driven,
    // not sort-paginated (same convention as solon E9 / show-pony#91).
    name: createTextField({
      required: true,
      personal: "self",
      find: "fuzzy",
    }),
    email: createTextField({
      personal: "self",
      find: "exact",
      format: "email",
    }),
    status: createSelectField({
      options: RSVP_STATUSES,
      default: "yes",
      filterable: true,
      sortable: true,
    }),
    plusN: createNumberField({ sortable: true, integer: true }),
    // Free text from an anonymous guest — still personal data about that
    // guest, subject = the RSVP row itself (personal: "self").
    note: createLongTextField({
      personal: "self",
      find: "none",
    }),
  },
});

export const rsvpTable = buildEntityTable("rsvp", rsvpEntity);

export const rsvpExecutor = createEventStoreExecutor(rsvpTable, rsvpEntity, {
  entityName: "rsvp",
});
