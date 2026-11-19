// Tier caps for show-pony — aligned with src/marketing/pricing.ts (apex preview).

import {
  capsForTierFromMap,
  type TierDefinition,
} from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import { isOneOf } from "@cosmicdrift/kumiko-types/type-guards";
import {
  SHOWPONY_TIERS,
  type ShowPonyTier,
  TIER_MAX_EVENTS,
  TIER_MAX_GUESTS,
} from "../../marketing/pricing";

export type { ShowPonyTier };
export type TierName = ShowPonyTier;

export const TIER_NAMES = SHOWPONY_TIERS;

export const DEFAULT_TIER: TierName = "free";

export type ShowPonyCaps = {
  readonly maxEvents: number;
  readonly maxGuests: number;
};

const UNLIMITED = Number.POSITIVE_INFINITY;

function cap(value: number | null): number {
  return value ?? UNLIMITED;
}

function tierEntry(tier: TierName): TierDefinition<ShowPonyCaps> {
  return {
    features: [],
    caps: { maxEvents: cap(TIER_MAX_EVENTS[tier]), maxGuests: cap(TIER_MAX_GUESTS[tier]) },
  };
}

export const SHOWPONY_TIER_MAP = {
  free: tierEntry("free"),
  starter: tierEntry("starter"),
  pro: tierEntry("pro"),
  studio: tierEntry("studio"),
} satisfies Record<TierName, TierDefinition<ShowPonyCaps>>;

export function isTierName(value: string): value is TierName {
  return isOneOf(TIER_NAMES, value);
}

export const capsForTier = capsForTierFromMap(SHOWPONY_TIER_MAP, isTierName, DEFAULT_TIER);

type StripePriceVars = Readonly<Record<string, string | undefined>>;

/** Stripe price id -> tier for the billing boot option; unset price vars map nothing. */
export function priceToTierFromEnv(vars: StripePriceVars): Record<string, TierName> {
  const priceToTier: Record<string, TierName> = {};
  if (vars["STRIPE_PRICE_STARTER"]) priceToTier[vars["STRIPE_PRICE_STARTER"]] = "starter";
  if (vars["STRIPE_PRICE_PRO"]) priceToTier[vars["STRIPE_PRICE_PRO"]] = "pro";
  return priceToTier;
}
