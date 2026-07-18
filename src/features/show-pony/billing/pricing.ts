import type { BillingInfo } from "../handlers/billing-info.query";
import { TIER_MONTHLY_EUR } from "../../../marketing/pricing";
import { capsForTier, type TierName } from "../tier-map";

/** Billable via Stripe — studio is sales-assisted only. */
export type PaidTier = "starter" | "pro";

export const PAID_TIERS: readonly PaidTier[] = ["starter", "pro"];

export const BILLING_TIER_MONTHLY_EUR: Readonly<Record<PaidTier, number>> = {
  starter: TIER_MONTHLY_EUR.starter,
  pro: TIER_MONTHLY_EUR.pro,
};

export type BenefitItem = {
  readonly labelKey: string;
  readonly count?: number | "unlimited";
};

function countOf(n: number): number | "unlimited" {
  return Number.isFinite(n) ? n : "unlimited";
}

export function tierBenefits(tier: PaidTier): readonly BenefitItem[] {
  const caps = capsForTier(tier);
  return [
    { labelKey: "showpony:billing.benefit.events", count: countOf(caps.maxEvents) },
    { labelKey: "showpony:billing.benefit.guests", count: countOf(caps.maxGuests) },
  ];
}

export function tierDisplayName(tier: TierName): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

const TERMINAL_SUBSCRIPTION_STATUSES = ["canceled", "incomplete_expired"];

export function hasManageableSubscriptionState(subscription: BillingInfo["subscription"]): boolean {
  return subscription !== null && !TERMINAL_SUBSCRIPTION_STATUSES.includes(subscription.status);
}

// The status pill only shows for a subscription that's either the tier the
// tenant is currently on, or in a non-"active" state worth surfacing (e.g.
// "past_due" while browsing a different tier). Returns the i18n status key
// to render, or null to hide the pill.
export function subscriptionStatusKey(
  subscription: BillingInfo["subscription"],
  currentTier: BillingInfo["tier"],
): string | null {
  if (!subscription) return null;
  if (subscription.tier !== currentTier && subscription.status === "active") return null;
  return subscription.status;
}
