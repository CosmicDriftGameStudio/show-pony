// Marketing tier numbers — wired to tier-engine + Stripe in run-config.ts (P2).

export const SHOWPONY_TIERS = ["free", "starter", "pro", "studio"] as const;
export type ShowPonyTier = (typeof SHOWPONY_TIERS)[number];
export const PAID_TIERS = ["starter", "pro"] as const satisfies readonly ShowPonyTier[];
export type PaidTier = (typeof PAID_TIERS)[number];

export const TIER_MONTHLY_EUR: Record<PaidTier, number> = {
  starter: 9,
  pro: 29,
};

export const TIER_MAX_EVENTS: Record<ShowPonyTier, number | null> = {
  free: 1,
  starter: 10,
  pro: 50,
  studio: null,
};

export const TIER_MAX_GUESTS: Record<ShowPonyTier, number | null> = {
  free: 50,
  starter: 500,
  pro: 5000,
  studio: null,
};
