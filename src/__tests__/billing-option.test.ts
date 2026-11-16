import { describe, expect, test } from "bun:test";
import { resolveBillingOption } from "@cosmicdrift/kumiko-server-runtime";
import { buildShowPonyBillingOption } from "../features/show-pony/billing/billing-option";
import { priceToTierFromEnv, TIER_NAMES } from "../features/show-pony/tier-map";

describe("buildShowPonyBillingOption", () => {
  test("no configured price → no billing option", () => {
    expect(buildShowPonyBillingOption(priceToTierFromEnv({}))).toBeUndefined();
  });

  test("configured prices map to tiers with free as default", () => {
    const option = buildShowPonyBillingOption(
      priceToTierFromEnv({ STRIPE_PRICE_STARTER: "price_s", STRIPE_PRICE_PRO: "price_p" }),
    );
    expect(option).toEqual({
      stripe: { priceToTier: { price_s: "starter", price_p: "pro" } },
      defaultTier: "free",
      tierNames: TIER_NAMES,
    });
  });

  test("the option resolves to the subscription webhook route and the stripe provider", () => {
    const option = buildShowPonyBillingOption({ price_s: "starter" });
    if (!option) throw new Error("expected a billing option");
    const resolved = resolveBillingOption(option, {});
    expect(resolved.route.path).toBe("/webhooks/subscription/:providerName");
    expect(resolved.features.map((feature) => feature.name)).toContain("subscription-stripe");
  });
});
