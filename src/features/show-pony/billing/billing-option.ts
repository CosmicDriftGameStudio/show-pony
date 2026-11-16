import type { BillingBootOption, KmsMode } from "@cosmicdrift/kumiko-server-runtime";
import { DEFAULT_TIER, TIER_NAMES, type TierName } from "../tier-map";

export const SHOW_PONY_KMS_MODE = {
  plaintextReason: "show-pony demo app, no subject-keys KMS provisioned",
} as const satisfies KmsMode;

// No configured price means no provider and no webhook route; billing-plans then resolves enabled:false.
export function buildShowPonyBillingOption(
  priceToTier: Readonly<Record<string, TierName>>,
): BillingBootOption | undefined {
  if (Object.keys(priceToTier).length === 0) return undefined;
  return { stripe: { priceToTier }, defaultTier: DEFAULT_TIER, tierNames: TIER_NAMES };
}
