import { describe, expect, test } from "bun:test";
import { rsvpRejectionMessageKey } from "../features/show-pony/rsvp-errors.shared";

describe("rsvpRejectionMessageKey", () => {
  test("maps each known rejection reason to its message key", () => {
    expect(rsvpRejectionMessageKey("event_full")).toBe("showpony:errors.eventFull");
    expect(rsvpRejectionMessageKey("rsvp_already_submitted")).toBe(
      "showpony:errors.rsvpAlreadySubmitted",
    );
    expect(rsvpRejectionMessageKey("guest_limit_reached")).toBe("showpony:errors.guestLimitReached");
  });

  test("returns undefined for unknown reasons and non-strings", () => {
    expect(rsvpRejectionMessageKey("other")).toBeUndefined();
    expect(rsvpRejectionMessageKey(undefined)).toBeUndefined();
    expect(rsvpRejectionMessageKey(42)).toBeUndefined();
  });
});
