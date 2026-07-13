// Stripe billing config from env — shared by bin/main.ts and bin/server.ts.

import type { TierName } from "../src/features/show-pony/tier-map";

export type StripeBillingConfig = {
  readonly apiKey?: string;
  readonly webhookSecret?: string;
  readonly priceToTier: Readonly<Record<string, Exclude<TierName, "free" | "studio">>>;
  readonly prices: Readonly<Partial<Record<"starter" | "pro", string>>>;
};

type StripeEnvVars = {
  readonly STRIPE_API_KEY?: string | undefined;
  readonly STRIPE_WEBHOOK_SECRET?: string | undefined;
  readonly STRIPE_PRICE_STARTER?: string | undefined;
  readonly STRIPE_PRICE_PRO?: string | undefined;
};

export function buildStripeBillingConfig(vars: StripeEnvVars): StripeBillingConfig | null {
  const { STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET } = vars;

  const prices: Partial<Record<"starter" | "pro", string>> = {};
  const priceToTier: Record<string, "starter" | "pro"> = {};
  if (vars.STRIPE_PRICE_STARTER) {
    prices.starter = vars.STRIPE_PRICE_STARTER;
    priceToTier[vars.STRIPE_PRICE_STARTER] = "starter";
  }
  if (vars.STRIPE_PRICE_PRO) {
    prices.pro = vars.STRIPE_PRICE_PRO;
    priceToTier[vars.STRIPE_PRICE_PRO] = "pro";
  }

  if (Object.keys(prices).length === 0) return null;

  return {
    ...(STRIPE_API_KEY ? { apiKey: STRIPE_API_KEY } : {}),
    ...(STRIPE_WEBHOOK_SECRET ? { webhookSecret: STRIPE_WEBHOOK_SECRET } : {}),
    priceToTier,
    prices,
  };
}
