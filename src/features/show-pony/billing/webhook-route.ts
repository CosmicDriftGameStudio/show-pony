// Stripe-Webhook-Route + Tier-Sync. Delegates to createSubscriptionTierSync()
// (infra#446) — the adapter was 1:1 identical to publicstatus's except for
// the TierName union/default and the tier-assignment table handle.
// onSyncError: "fail-webhook" preserves the existing behavior: a sync
// failure fails the webhook response, Stripe retries the idempotent
// process-event write, and the tier sync gets a second attempt.

import {
  createSubscriptionTierSync,
  type SystemWriteResult,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import type { DbConnection, EntityTable } from "@cosmicdrift/kumiko-framework/db";
import type { EntityDefinition, Registry, TenantId } from "@cosmicdrift/kumiko-framework/engine";
import type { Hono } from "hono";
import { DEFAULT_TIER, isTierName, type TierName } from "../tier-map";
import { tierAssignmentTable as rawTierAssignmentTable } from "../tier-resolver";

export type SubscriptionWebhookRouteDeps = {
  readonly db: DbConnection;
  readonly registry: Registry;
  readonly dispatchSystemWrite: (args: {
    readonly handlerQn: string;
    readonly payload: unknown;
    readonly tenantId: TenantId;
  }) => Promise<SystemWriteResult>;
};

// @cast-boundary generic-factory — createSubscriptionTierSync erases the
// concrete entity's field types to EntityDefinition; buildEntityTable's
// return type can't structurally widen to that on its own.
const tierAssignmentTable = rawTierAssignmentTable as unknown as EntityTable<EntityDefinition>;

export function wireSubscriptionWebhookRoute(app: Hono, deps: SubscriptionWebhookRouteDeps): void {
  createSubscriptionTierSync<TierName>({
    db: deps.db,
    registry: deps.registry,
    dispatchSystemWrite: deps.dispatchSystemWrite,
    tierAssignmentTable,
    isTierName,
    defaultTier: DEFAULT_TIER,
    onSyncError: "fail-webhook",
  }).wireSubscriptionWebhookRoute(app);
}
