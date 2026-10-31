import { createTierResolver } from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import { capsForTier, DEFAULT_TIER, isTierName } from "./tier-map";

export const { tierAssignmentTable, resolveTier, resolveTierCaps } = createTierResolver({
  capsForTier,
  isTierName,
  defaultTier: DEFAULT_TIER,
});
