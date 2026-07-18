import { expect, test } from "bun:test";
import {
  hasManageableSubscriptionState,
  subscriptionStatusKey,
} from "../features/show-pony/billing/pricing";
import { isAtLimit } from "../features/show-pony/web/cap-counter";

test("isAtLimit", () => {
  expect(isAtLimit({ used: 5, limit: null })).toBe(false);
  expect(isAtLimit({ used: 5, limit: 10 })).toBe(false);
  expect(isAtLimit({ used: 10, limit: 10 })).toBe(true);
  expect(isAtLimit({ used: 11, limit: 10 })).toBe(true);
});

test("hasManageableSubscriptionState", () => {
  expect(hasManageableSubscriptionState(null)).toBe(false);
  expect(
    hasManageableSubscriptionState({ status: "active", tier: "starter", providerName: "stripe" }),
  ).toBe(true);
  expect(
    hasManageableSubscriptionState({
      status: "canceled",
      tier: "starter",
      providerName: "stripe",
    }),
  ).toBe(false);
  expect(
    hasManageableSubscriptionState({
      status: "incomplete_expired",
      tier: "starter",
      providerName: "stripe",
    }),
  ).toBe(false);
});

test("subscriptionStatusKey", () => {
  expect(subscriptionStatusKey(null, "starter")).toBeNull();
  // Same tier, active — shows the status pill (confirms it's the live plan).
  expect(
    subscriptionStatusKey({ status: "active", tier: "starter", providerName: "stripe" }, "starter"),
  ).toBe("active");
  // Different tier, active subscription elsewhere — hide (not this tier's concern).
  expect(
    subscriptionStatusKey({ status: "active", tier: "pro", providerName: "stripe" }, "starter"),
  ).toBeNull();
  // Non-active status is always surfaced, regardless of tier match.
  expect(
    subscriptionStatusKey(
      { status: "past_due", tier: "starter", providerName: "stripe" },
      "starter",
    ),
  ).toBe("past_due");
  expect(
    subscriptionStatusKey({ status: "past_due", tier: "pro", providerName: "stripe" }, "starter"),
  ).toBe("past_due");
});
