// Stripe-Webhook-Route + Tier-Sync. Delegates to createSubscriptionTierSync() —
// the adapter is 1:1 identical to publicstatus's except for the TierName
// union/default.
// onSyncError: "fail-webhook" preserves the existing behavior: a sync
// failure fails the webhook response, Stripe retries the idempotent
// process-event write, and the tier sync gets a second attempt.
//
// extraRoutes are built before buildServer exists (no db/registry yet), so
// the sync has no db/registry/dispatchSystemWrite/tierAssignmentTable at
// construction time anymore — it reads and writes exclusively through
// dispatchSystemQuery/dispatchSystemWrite from the route's own
// SignatureExtraRouteDeps at request time. createWebhookRoute() already
// defaults to the exact "/webhooks/subscription/:providerName" path this
// route has always used.

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
