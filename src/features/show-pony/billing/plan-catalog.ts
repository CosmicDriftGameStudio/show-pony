// The show-pony billing-plans catalog — the single wiring point for
// billing-foundation's catalog-derived query/screen/panel. Shared by
// run-config.ts, the webhook test and the billing-plans integration tests
// so they never drift onto separate catalog instances.

import {
  type BillingPlanBenefit,
  type BillingPlanCatalog,
  createBillingFoundationFeature,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import type { FeatureDefinition } from "@cosmicdrift/kumiko-framework/engine";
import { capsForTier } from "../tier-map";
import { resolveTier } from "../tier-resolver";

export type PaidTier = "starter" | "pro";

export const PAID_TIERS: readonly PaidTier[] = ["starter", "pro"];

export function eventsBenefit(count: number): BillingPlanBenefit {
  return Number.isFinite(count)
    ? { labelKey: "showpony:billing.benefit.events", params: { count } }
    : { labelKey: "showpony:billing.benefit.eventsUnlimited" };
}

export function guestsBenefit(count: number): BillingPlanBenefit {
  return Number.isFinite(count)
    ? { labelKey: "showpony:billing.benefit.guests", params: { count } }
    : { labelKey: "showpony:billing.benefit.guestsUnlimited" };
}

export const showPonyBillingCatalog: BillingPlanCatalog<PaidTier> = {
  plans: PAID_TIERS,
  tierLabelKey: (tier) => `showpony:billing.tier.${tier}`,
  benefits: (tier) => {
    const caps = capsForTier(tier);
    return [eventsBenefit(caps.maxEvents), guestsBenefit(caps.maxGuests)];
  },
  resolveCurrentTier: resolveTier,
  viewRoles: ["Admin"],
  purchaseRoles: ["Admin"],
  successPath: "/host/billing",
  cancelPath: "/host/billing",
};

export function createShowPonyBillingFoundationFeature(baseUrl: string): FeatureDefinition {
  return createBillingFoundationFeature({ baseUrl, catalog: showPonyBillingCatalog });
}
