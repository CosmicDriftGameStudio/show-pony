// E2E-only stub for the "stripe" subscriptionProvider — screenshot/e2e runs
// never talk to real Stripe. Registered under the same extension-name
// ("stripe") the real subscription-stripe plugin uses, so the catalog's
// single-provider resolution stays unchanged. Only bin/server.ts imports
// this; bin/main.ts (prod) never does.

import type {
  ProviderPrice,
  SubscriptionProviderPlugin,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { defineFeature, type FeatureDefinition } from "@cosmicdrift/kumiko-framework/engine";
import type { E2eExtraSeeder } from "@cosmicdrift/kumiko-testing/e2e/seed-route";
import * as z from "zod";

const STUB_PRICE_TO_TIER: Readonly<Record<string, "starter" | "pro">> = {
  price_e2e_starter: "starter",
  price_e2e_pro: "pro",
};

const STUB_PRICE_UNIT_AMOUNTS: Readonly<Record<string, number>> = {
  price_e2e_starter: 900,
  price_e2e_pro: 2900,
};

// Set by the "billing-disabled" extra-seeder — module-local because the
// stub plugin has no per-tenant config store of its own.
const billingDisabledTenantIds = new Set<string>();

const e2eBillingStubPlugin: SubscriptionProviderPlugin = {
  verifyAndParseWebhook: async () => null,
  priceToTier: STUB_PRICE_TO_TIER,
  isBillingEnabled: async (ctx) => !billingDisabledTenantIds.has(ctx.user.tenantId),
  retrievePrices: async (_ctx, priceIds): Promise<readonly ProviderPrice[]> =>
    priceIds.flatMap((priceId) => {
      const unitAmount = STUB_PRICE_UNIT_AMOUNTS[priceId];
      if (unitAmount === undefined) return [];
      return [
        {
          priceId,
          unitAmount,
          currency: "eur",
          interval: "month",
          intervalCount: 1,
          active: true,
          metadata: {},
        },
      ];
    }),
  createCheckoutSession: async (_ctx, options) => ({ url: options.successUrl }),
  createPortalSession: async (_ctx, options) => ({ url: options.returnUrl }),
  createPlanSwitchSession: async (_ctx, options) => ({ url: options.returnUrl }),
};

export function createE2eBillingStubFeature(): FeatureDefinition {
  return defineFeature("e2e-billing-stub", (r) => {
    r.requires("billing-foundation");
    r.useExtension("subscriptionProvider", "stripe", e2eBillingStubPlugin);
  });
}

const billingSubscriptionSeedSchema = z.object({
  tier: z.enum(["starter", "pro"]),
  status: z.enum(["active", "canceled"]),
});

function subscriptionEventPayload(options: {
  readonly tenantId: string;
  readonly providerEventId: string;
  readonly type: "subscription.created" | "subscription.canceled";
  readonly status: "active" | "canceled";
  readonly tier: "starter" | "pro";
}) {
  return {
    providerEventId: options.providerEventId,
    providerName: "stripe",
    type: options.type,
    providerCustomerId: `cus_e2e_${options.tenantId}`,
    providerSubscriptionId: `sub_e2e_${options.tenantId}`,
    status: options.status,
    tier: options.tier,
    currentPeriodEndIso: "2026-12-01T00:00:00Z",
    rawPayload: "{}",
  };
}

// Seeds a subscription straight through billing-foundation's own
// process-event write-handler (bypassing the webhook route the stub has no
// signature for), then syncs show-pony's own tier-assignment the same way
// the real webhook route's tier-sync step would — process-event alone never
// touches tier-engine.
const billingSubscriptionSeeder: E2eExtraSeeder = async (ctx, tenantId, body) => {
  const parsed = billingSubscriptionSeedSchema.parse(body);
  await ctx.write(
    "billing-foundation:write:process-event",
    subscriptionEventPayload({
      tenantId,
      providerEventId: `e2e_${tenantId}_created`,
      type: "subscription.created",
      status: "active",
      tier: parsed.tier,
    }),
  );
  if (parsed.status === "canceled") {
    await ctx.write(
      "billing-foundation:write:process-event",
      subscriptionEventPayload({
        tenantId,
        providerEventId: `e2e_${tenantId}_canceled`,
        type: "subscription.canceled",
        status: "canceled",
        tier: parsed.tier,
      }),
    );
  }
  await ctx.write("tier-engine:write:set-tenant-tier", {
    tenantId,
    tier: parsed.status === "canceled" ? "free" : parsed.tier,
  });
  return null;
};

const billingDisabledSeeder: E2eExtraSeeder = async (_ctx, tenantId) => {
  billingDisabledTenantIds.add(tenantId);
  return null;
};

export const e2eBillingExtraSeeders: Readonly<Record<string, E2eExtraSeeder>> = {
  "billing-subscription": billingSubscriptionSeeder,
  "billing-disabled": billingDisabledSeeder,
};
