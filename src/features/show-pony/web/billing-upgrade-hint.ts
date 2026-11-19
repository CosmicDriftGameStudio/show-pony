import {
  BillingPlanActions,
  type BillingPlansResult,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation/web";

export type CapLimitUsage = { readonly used: number | null; readonly limit: number | null };

export function isAtLimit(usage: CapLimitUsage): boolean {
  return usage.limit !== null && usage.used !== null && usage.used >= usage.limit;
}

// result.plans follows the catalog order (smallest plan first), so only a
// purchasable plan after the current one is an upgrade; a switch down to a
// smaller plan never lifts a cap.
export function isUpgradeOffered(result: BillingPlansResult | null): boolean {
  if (result === null || !result.enabled || !result.canPurchase) return false;
  const currentIndex = result.plans.findIndex((plan) => plan.isCurrent);
  return result.plans.some(
    (plan, index) =>
      index > currentIndex &&
      (plan.action === BillingPlanActions.checkout || plan.action === BillingPlanActions.switch),
  );
}
