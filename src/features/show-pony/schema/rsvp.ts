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

export const rsvpTable = buildEntityTable("rsvp", rsvpEntity);

export const rsvpExecutor = createEventStoreExecutor(rsvpTable, rsvpEntity, {
  entityName: "rsvp",
});

