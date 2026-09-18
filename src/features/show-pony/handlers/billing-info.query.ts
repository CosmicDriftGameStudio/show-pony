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
});
