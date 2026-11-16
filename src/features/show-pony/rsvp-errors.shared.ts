import { isOneOf } from "@cosmicdrift/kumiko-types/type-guards";

// Shared by the rsvp:submit handler and the public page, which maps each reason to its own message.
export const GUEST_LIMIT_REACHED = "guest_limit_reached";
export const EVENT_FULL = "event_full";
export const RSVP_ALREADY_SUBMITTED = "rsvp_already_submitted";

const RSVP_REJECTION_REASONS = [GUEST_LIMIT_REACHED, EVENT_FULL, RSVP_ALREADY_SUBMITTED] as const;
type RsvpRejectionReason = (typeof RSVP_REJECTION_REASONS)[number];

const RSVP_REJECTION_MESSAGE_KEYS = {
  [GUEST_LIMIT_REACHED]: "showpony:errors.guestLimitReached",
  [EVENT_FULL]: "showpony:errors.eventFull",
  [RSVP_ALREADY_SUBMITTED]: "showpony:errors.rsvpAlreadySubmitted",
} as const satisfies Record<RsvpRejectionReason, string>;

export type RsvpRejectionMessageKey = (typeof RSVP_REJECTION_MESSAGE_KEYS)[RsvpRejectionReason];

export function rsvpRejectionMessageKey(reason: unknown): RsvpRejectionMessageKey | undefined {
  return isOneOf(RSVP_REJECTION_REASONS, reason) ? RSVP_REJECTION_MESSAGE_KEYS[reason] : undefined;
}
