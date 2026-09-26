// Stripe billing config from env — shared by bin/main.ts and bin/server.ts.
// createSubscriptionStripeFeature always mounts (billingLive gates checkout
// at runtime); priceToTier may be empty when no STRIPE_PRICE_* env is set.

import type { TierName } from "../src/features/show-pony/tier-map";

export type StripeBillingConfig = {
  readonly apiKey?: string;
  readonly webhookSecret?: string;
  readonly priceToTier: Readonly<Record<string, Exclude<TierName, "free" | "studio">>>;
};

type StripeEnvVars = {
  readonly STRIPE_API_KEY?: string | undefined;
  readonly STRIPE_WEBHOOK_SECRET?: string | undefined;
  readonly STRIPE_PRICE_STARTER?: string | undefined;
  readonly STRIPE_PRICE_PRO?: string | undefined;
};

export function buildStripeBillingConfig(vars: StripeEnvVars): StripeBillingConfig {
  const { STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET } = vars;

  const priceToTier: Record<string, "starter" | "pro"> = {};
  if (vars.STRIPE_PRICE_STARTER) {
    priceToTier[vars.STRIPE_PRICE_STARTER] = "starter";
  }
  if (vars.STRIPE_PRICE_PRO) {
    priceToTier[vars.STRIPE_PRICE_PRO] = "pro";
  }

  return {
    ...(STRIPE_API_KEY ? { apiKey: STRIPE_API_KEY } : {}),
    ...(STRIPE_WEBHOOK_SECRET ? { webhookSecret: STRIPE_WEBHOOK_SECRET } : {}),
    priceToTier,
  };
}

/** The webhook route only needs to be mounted once at least one price maps
 *  to a tier — an empty priceToTier means every incoming event would be
 *  dropped by verifyAndParseWebhook anyway. */
export function hasConfiguredPrices(config: StripeBillingConfig): boolean {
  return Object.keys(config.priceToTier).length > 0;
}
