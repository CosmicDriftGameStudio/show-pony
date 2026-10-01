// Stripe webhook route + tier sync (createSubscriptionTierSync).
// The route is built before buildServer exists, so the sync has no
// db/registry at construction time; it reads and writes exclusively through
// the dispatchers of the route's SignatureExtraRouteDeps at request time.
// onSyncError "fail-webhook": a sync failure fails the webhook response,
// Stripe retries the idempotent process-event write, and the tier sync gets a
// second attempt.

import { createSubscriptionTierSync } from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import type { ExtraRouteDefinition } from "@cosmicdrift/kumiko-framework/api";
import { DEFAULT_TIER, isTierName, type TierName } from "../tier-map";

export function buildSubscriptionWebhookRoute(): ExtraRouteDefinition {
  return createSubscriptionTierSync<TierName>({
    isTierName,
    defaultTier: DEFAULT_TIER,
    onSyncError: "fail-webhook",
  }).createWebhookRoute();
}
