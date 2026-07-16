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
