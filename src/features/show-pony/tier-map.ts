// Tier caps for show-pony — aligned with src/marketing/pricing.ts (apex preview).

import type { TierMap } from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import { type ShowPonyTier, TIER_MAX_EVENTS, TIER_MAX_GUESTS } from "../../marketing/pricing";

export type { ShowPonyTier };
export type TierName = ShowPonyTier;

export const TIER_NAMES = [
  "free",
  "starter",
  "pro",
  "studio",
] as const satisfies readonly TierName[];

export const DEFAULT_TIER: TierName = "free";

export type ShowPonyCaps = {
  readonly maxEvents: number;
  readonly maxGuests: number;
};

const UNLIMITED = Number.POSITIVE_INFINITY;

function cap(value: number | null): number {
  return value ?? UNLIMITED;
}

export const SHOWPONY_TIER_MAP: TierMap<ShowPonyCaps> = {
  free: {
    features: [],
    caps: { maxEvents: cap(TIER_MAX_EVENTS.free), maxGuests: cap(TIER_MAX_GUESTS.free) },
  },
  starter: {
    features: [],
    caps: { maxEvents: cap(TIER_MAX_EVENTS.starter), maxGuests: cap(TIER_MAX_GUESTS.starter) },
  },
  pro: {
    features: [],
    caps: { maxEvents: cap(TIER_MAX_EVENTS.pro), maxGuests: cap(TIER_MAX_GUESTS.pro) },
  },
  studio: {
    features: [],
    caps: { maxEvents: cap(TIER_MAX_EVENTS.studio), maxGuests: cap(TIER_MAX_GUESTS.studio) },
  },
};

export function isTierName(value: string): value is TierName {
  return (TIER_NAMES as readonly string[]).includes(value);
}

export function capsForTier(tier: string): ShowPonyCaps {
  const name = isTierName(tier) ? tier : DEFAULT_TIER;
  const def = SHOWPONY_TIER_MAP[name];
  if (!def) {
    throw new Error(`tier-map: tier "${name}" not in SHOWPONY_TIER_MAP`);
  }
  return def.caps;
}
