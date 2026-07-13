import { defineQueryHandler } from "@cosmicdrift/kumiko-framework/engine";
import {
  subscriptionAggregateId,
  subscriptionsProjectionTable,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { SUBSCRIPTION_STRIPE_FEATURE } from "@cosmicdrift/kumiko-bundled-features/subscription-stripe";
import { fetchOne } from "@cosmicdrift/kumiko-framework/db";
import { QnTypes, qn, SYSTEM_TENANT_ID, toKebab } from "@cosmicdrift/kumiko-framework/engine";
import { z } from "zod";
import { getBillingPrices } from "../app-context-helpers";
import type { TierName } from "../tier-map";
import { resolveTier } from "../tier-resolver";

const stripeFeature = toKebab(SUBSCRIPTION_STRIPE_FEATURE);
const STRIPE_API_KEY_CONFIG_QN = qn(stripeFeature, QnTypes.config, "api-key");
const STRIPE_BILLING_LIVE_CONFIG_QN = qn(stripeFeature, QnTypes.config, toKebab("billingLive"));

export type BillingInfo = {
  readonly enabled: boolean;
  readonly tier: TierName;
  readonly subscription: {
    readonly status: string;
    readonly tier: string;
    readonly providerName: string;
  } | null;
  readonly prices: Readonly<Partial<Record<"starter" | "pro", string>>>;
};

export const billingInfoQuery = defineQueryHandler({
  name: "billing-info",
  schema: z.object({}),
  access: { roles: ["Admin"] },
  async handler(_event, ctx): Promise<BillingInfo> {
    const tier = await resolveTier(ctx.db.raw, ctx.user.tenantId);
    const prices = getBillingPrices(ctx);
    if (!prices) return { enabled: false, tier, subscription: null, prices: {} };

    const billingLive = ctx.config
      ? (await ctx.config(STRIPE_BILLING_LIVE_CONFIG_QN)) === true
      : false;
    const apiKeySet = ctx.secrets
      ? await ctx.secrets.has(SYSTEM_TENANT_ID, STRIPE_API_KEY_CONFIG_QN)
      : false;

    const sub = await fetchOne<{ status?: unknown; tier?: unknown; providerName?: unknown }>(
      ctx.db.raw,
      subscriptionsProjectionTable,
      { id: subscriptionAggregateId(ctx.user.tenantId) },
    );
    return {
      enabled: billingLive && apiKeySet,
      tier,
      subscription:
        sub &&
        typeof sub.status === "string" &&
        typeof sub.tier === "string" &&
        typeof sub.providerName === "string"
          ? { status: sub.status, tier: sub.tier, providerName: sub.providerName }
          : null,
      prices,
    };
  },
});
