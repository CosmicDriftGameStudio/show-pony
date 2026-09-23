import {
  type BillingInfo as BillingInfoForTier,
  createBillingInfoQueryConfig,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { defineQueryHandler } from "@cosmicdrift/kumiko-framework/engine";
import { getBillingPrices } from "../app-context-helpers";
import type { TierName } from "../tier-map";
import { resolveTier } from "../tier-resolver";

export type BillingInfo = BillingInfoForTier<TierName>;

export const billingInfoQuery = defineQueryHandler({
  ...createBillingInfoQueryConfig<TierName>({
    roles: ["Admin"],
    resolveTier,
    getBillingPrices,
  }),
  description:
    "Returns the tenant's current plan tier (free, starter, pro or studio), the subscription status and payment provider when a subscription exists, whether Stripe billing is live, and the configured price per tier; Admin only.",
});
