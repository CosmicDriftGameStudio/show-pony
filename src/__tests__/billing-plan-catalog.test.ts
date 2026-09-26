import { expect, test } from "bun:test";
import {
  eventsBenefit,
  guestsBenefit,
  PAID_TIERS,
  showPonyBillingCatalog,
} from "../features/show-pony/billing/plan-catalog";
import { isAtLimit } from "../features/show-pony/web/cap-counter";

test("plans list is the paid tiers, in order", () => {
  expect(showPonyBillingCatalog.plans).toEqual(PAID_TIERS);
  expect(showPonyBillingCatalog.plans).toEqual(["starter", "pro"]);
});

test("tierLabelKey points at the showpony:billing.tier.* i18n key", () => {
  expect(showPonyBillingCatalog.tierLabelKey("starter")).toBe("showpony:billing.tier.starter");
  expect(showPonyBillingCatalog.tierLabelKey("pro")).toBe("showpony:billing.tier.pro");
});

test("benefits carry the finite event/guest caps for starter and pro", () => {
  expect(showPonyBillingCatalog.benefits("starter")).toEqual([
    { labelKey: "showpony:billing.benefit.events", params: { count: 10 } },
    { labelKey: "showpony:billing.benefit.guests", params: { count: 500 } },
  ]);
  expect(showPonyBillingCatalog.benefits("pro")).toEqual([
    { labelKey: "showpony:billing.benefit.events", params: { count: 50 } },
    { labelKey: "showpony:billing.benefit.guests", params: { count: 5000 } },
  ]);
});

test("eventsBenefit/guestsBenefit fall back to the unlimited variant for an infinite cap", () => {
  expect(eventsBenefit(Number.POSITIVE_INFINITY)).toEqual({
    labelKey: "showpony:billing.benefit.eventsUnlimited",
  });
  expect(guestsBenefit(Number.POSITIVE_INFINITY)).toEqual({
    labelKey: "showpony:billing.benefit.guestsUnlimited",
  });
});

test("isAtLimit is true only once used reaches a finite limit", () => {
  expect(isAtLimit({ used: 3, limit: 10 })).toBe(false);
  expect(isAtLimit({ used: 10, limit: 10 })).toBe(true);
  expect(isAtLimit({ used: 999, limit: null })).toBe(false);
});
