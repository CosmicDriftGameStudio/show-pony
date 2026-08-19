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
    // Guest-submitted personal data (collected anonymously). Sortable
    // guest-list lookup is a core feature here, which structurally conflicts
    // with `personal: "self"` (validatePiiAndRetention throws on ANY
    // personal annotation + sortable, not just encrypted fields) — declared
    // `personal: false` instead, same pattern as `note` below.
    name: createTextField({
      required: true,
      sortable: true,
      personal: false,
      reason: "guest_list_sort_no_kms_provisioned",
    }),
    email: createTextField({
      personal: false,
      reason: "guest_list_no_kms_provisioned",
    }),
    status: createSelectField({ options: RSVP_STATUSES, default: "yes", filterable: true }),
    plusN: createNumberField({ sortable: true, integer: true }),
    // Free text from an anonymous submitter — no user FK, so `personal: { of }`
    // can't apply; declare it non-personal business input with an explicit reason.
    note: createLongTextField({
      personal: false,
      reason: "anonymous_guest_input",
    }),
  },
});

export const rsvpTable = buildEntityTable("rsvp", rsvpEntity);

export const rsvpExecutor = createEventStoreExecutor(rsvpTable, rsvpEntity, {
  entityName: "rsvp",
});
