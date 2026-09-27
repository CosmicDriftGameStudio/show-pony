import { expect, test } from "bun:test";
import type { BillingPlansResult } from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { BillingPlanActions } from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import {
  eventsBenefit,
  guestsBenefit,
  PAID_TIERS,
  showPonyBillingCatalog,
} from "../features/show-pony/billing/plan-catalog";
import { isUpgradeOffered } from "../features/show-pony/web/billing-upgrade-hint";
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

test("successPath/cancelPath/returnPath all point at the host billing screen", () => {
  expect(showPonyBillingCatalog.successPath).toBe("/host/billing");
  expect(showPonyBillingCatalog.cancelPath).toBe("/host/billing");
  expect(showPonyBillingCatalog.returnPath).toBe("/host/billing");
});

function billingPlansResult(overrides: Partial<BillingPlansResult> = {}): BillingPlansResult {
  return {
    enabled: true,
    currentTier: { tier: "free", labelKey: "showpony:billing.tier.free", benefits: [] },
    subscription: null,
    canPurchase: true,
    plans: [],
    ...overrides,
  };
}

test("isUpgradeOffered is false for a null result", () => {
  expect(isUpgradeOffered(null)).toBe(false);
});

test("isUpgradeOffered is false when billing is disabled", () => {
  const result = billingPlansResult({
    enabled: false,
    plans: [
      {
        tier: "starter",
        labelKey: "showpony:billing.tier.starter",
        price: null,
        benefits: [],
        isCurrent: false,
        action: BillingPlanActions.checkout,
      },
    ],
  });
  expect(isUpgradeOffered(result)).toBe(false);
});

test("isUpgradeOffered is false when the caller cannot purchase", () => {
  const result = billingPlansResult({
    canPurchase: false,
    plans: [
      {
        tier: "starter",
        labelKey: "showpony:billing.tier.starter",
        price: null,
        benefits: [],
        isCurrent: false,
        action: BillingPlanActions.checkout,
      },
    ],
  });
  expect(isUpgradeOffered(result)).toBe(false);
});

test("isUpgradeOffered is false when every plan is current/unavailable", () => {
  const result = billingPlansResult({
    plans: [
      {
        tier: "starter",
        labelKey: "showpony:billing.tier.starter",
        price: null,
        benefits: [],
        isCurrent: true,
        action: BillingPlanActions.current,
      },
      {
        tier: "pro",
        labelKey: "showpony:billing.tier.pro",
        price: null,
        benefits: [],
        isCurrent: false,
        action: BillingPlanActions.unavailable,
      },
    ],
  });
  expect(isUpgradeOffered(result)).toBe(false);
});

test("isUpgradeOffered is true when a plan offers checkout", () => {
  const result = billingPlansResult({
    plans: [
      {
        tier: "starter",
        labelKey: "showpony:billing.tier.starter",
        price: null,
        benefits: [],
        isCurrent: false,
        action: BillingPlanActions.checkout,
      },
    ],
  });
  expect(isUpgradeOffered(result)).toBe(true);
});

test("isUpgradeOffered is true when a plan offers a switch", () => {
  const result = billingPlansResult({
    plans: [
      {
        tier: "pro",
        labelKey: "showpony:billing.tier.pro",
        price: null,
        benefits: [],
        isCurrent: false,
        action: BillingPlanActions.switch,
      },
    ],
  });
  expect(isUpgradeOffered(result)).toBe(true);
});

test("isUpgradeOffered is false when the only purchasable plan is a switch down", () => {
  const result = billingPlansResult({
    currentTier: { tier: "pro", labelKey: "showpony:billing.tier.pro", benefits: [] },
    plans: [
      {
        tier: "starter",
        labelKey: "showpony:billing.tier.starter",
        price: null,
        benefits: [],
        isCurrent: false,
        action: BillingPlanActions.switch,
      },
      {
        tier: "pro",
        labelKey: "showpony:billing.tier.pro",
        price: null,
        benefits: [],
        isCurrent: true,
        action: BillingPlanActions.current,
      },
    ],
  });
  expect(isUpgradeOffered(result)).toBe(false);
});
