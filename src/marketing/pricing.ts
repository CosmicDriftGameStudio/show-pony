// Marketing-only tier numbers (P2 will wire tier-engine + Stripe).

export type ShowPonyTier = "free" | "starter" | "pro" | "studio";

export const TIER_MONTHLY_EUR: Record<Exclude<ShowPonyTier, "free" | "studio">, number> = {
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
