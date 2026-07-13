// Stripe webhook + tier-sync — same flow as publicstatus/billing/webhook-route.ts.

import {
  createSubscriptionWebhookHandler,
  SUBSCRIPTION_PROVIDER_EXTENSION,
  type SubscriptionProviderPlugin,
  SubscriptionStatuses,
  subscriptionAggregateId,
  subscriptionsProjectionTable,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import {
  TierEngineHandlers,
  tierAssignmentAggregateId,
} from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import { type DbConnection, fetchOne } from "@cosmicdrift/kumiko-framework/db";
import type { Registry, TenantId } from "@cosmicdrift/kumiko-framework/engine";
import type { Hono } from "hono";
import { DEFAULT_TIER, isTierName, type TierName } from "../tier-map";
import { tierAssignmentTable } from "../tier-resolver";

export const SUBSCRIPTION_WEBHOOK_PATH = "/webhooks/subscription/:providerName";

export type SystemWriteResult = {
  readonly isSuccess: boolean;
  readonly data?: unknown;
  readonly error?: { readonly code?: string; readonly message?: string };
};

export type SubscriptionWebhookRouteDeps = {
  readonly db: DbConnection;
  readonly registry: Registry;
  readonly dispatchSystemWrite: (args: {
    readonly handlerQn: string;
    readonly payload: unknown;
    readonly tenantId: TenantId;
  }) => Promise<SystemWriteResult>;
};

export function effectiveTierFromSubscription(
  status: string | undefined,
  tier: string | undefined,
): TierName {
  const usable = status === SubscriptionStatuses.active || status === SubscriptionStatuses.trialing;
  return usable && typeof tier === "string" && isTierName(tier) ? tier : DEFAULT_TIER;
}

async function syncTierFromSubscription(
  deps: SubscriptionWebhookRouteDeps,
  tenantId: TenantId,
): Promise<{ code: string; message: string } | null> {
  const sub = await fetchOne<{ status?: unknown; tier?: unknown }>(
    deps.db,
    subscriptionsProjectionTable,
    { id: subscriptionAggregateId(tenantId) },
  );
  if (!sub) return null;

  const effective = effectiveTierFromSubscription(
    typeof sub.status === "string" ? sub.status : undefined,
    typeof sub.tier === "string" ? sub.tier : undefined,
  );

  const assignment = await fetchOne<{ id?: unknown; version?: unknown; tier?: unknown }>(
    deps.db,
    tierAssignmentTable,
    { tenantId },
  );
  if (!assignment || typeof assignment.id !== "string" || typeof assignment.version !== "number") {
    const created = await deps.dispatchSystemWrite({
      handlerQn: TierEngineHandlers.create,
      payload: { id: tierAssignmentAggregateId(tenantId), tier: effective },
      tenantId,
    });
    if (!created.isSuccess) {
      return {
        code: "tier_sync_failed",
        message: `tier-engine create with "${effective}" failed: ${created.error?.code ?? "unknown"}`,
      };
    }
    return null;
  }
  if (assignment.tier === effective) return null;

  const result = await deps.dispatchSystemWrite({
    handlerQn: TierEngineHandlers.update,
    payload: { id: assignment.id, version: assignment.version, changes: { tier: effective } },
    tenantId,
  });
  if (!result.isSuccess) {
    return {
      code: "tier_sync_failed",
      message: `tier-engine update to "${effective}" failed: ${result.error?.code ?? "unknown"}`,
    };
  }
  return null;
}

export function wireSubscriptionWebhookRoute(app: Hono, deps: SubscriptionWebhookRouteDeps): void {
  const handler = createSubscriptionWebhookHandler({
    dispatchWrite: async ({ handlerQn, payload, tenantId }) => {
      const targetTenantId = tenantId as TenantId;
      const result = await deps.dispatchSystemWrite({
        handlerQn,
        payload,
        tenantId: targetTenantId,
      });
      if (!result.isSuccess) return result;
      const syncError = await syncTierFromSubscription(deps, targetTenantId);
      if (syncError) {
        return { isSuccess: false, error: syncError };
      }
      return result;
    },
    resolveProvider: (providerName) => {
      const usage = deps.registry
        .getExtensionUsages(SUBSCRIPTION_PROVIDER_EXTENSION)
        .find((u) => u.entityName === providerName);
      return usage?.options as SubscriptionProviderPlugin | undefined;
    },
  });
  app.post(SUBSCRIPTION_WEBHOOK_PATH, handler);
}
