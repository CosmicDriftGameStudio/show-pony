import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { billingFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { configValuesTable } from "@cosmicdrift/kumiko-bundled-features/config";
import { createComplianceProfilesFeature } from "@cosmicdrift/kumiko-bundled-features/compliance-profiles";
import { createSecretsFeature } from "@cosmicdrift/kumiko-bundled-features/secrets";
import { createSubscriptionStripeFeature } from "@cosmicdrift/kumiko-bundled-features/subscription-stripe";
import { createTenantLifecycleFeature } from "@cosmicdrift/kumiko-bundled-features/tenant-lifecycle";
import {
  TenantHandlers,
  tenantMembershipsTable,
  tenantTable,
} from "@cosmicdrift/kumiko-bundled-features/tenant";
import { createTierEngineFeature } from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import { userTable } from "@cosmicdrift/kumiko-bundled-features/user";
import { composeFeatures } from "@cosmicdrift/kumiko-dev-server/compose-features";
import { countWhere } from "@cosmicdrift/kumiko-framework/db";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import {
  createTestUser,
  setupTestStack,
  type TestStack,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import { deleteRows } from "@cosmicdrift/kumiko-framework/testing";
import Stripe from "stripe";
import { wireSubscriptionWebhookRoute } from "../features/show-pony/billing/webhook-route";
import { DEFAULT_TIER, SHOWPONY_TIER_MAP } from "../features/show-pony/tier-map";
import { resolveTier, tierAssignmentTable } from "../features/show-pony/tier-resolver";

const TEST_SECRET = "whsec_test_showpony_billing";
const TEST_API_KEY = "sk_test_showpony_billing";
const PRICE_TO_TIER = { price_starter_sp: "starter", price_pro_sp: "pro" };

const stripeForFixtures = new Stripe(TEST_API_KEY);

const features = composeFeatures(
  [
    createTierEngineFeature({ defaultTier: DEFAULT_TIER, tierMap: SHOWPONY_TIER_MAP }),
    createComplianceProfilesFeature(),
    createTenantLifecycleFeature(),
    billingFoundationFeature,
    createSecretsFeature(),
    createSubscriptionStripeFeature({
      webhookSecret: TEST_SECRET,
      apiKey: TEST_API_KEY,
      priceToTier: PRICE_TO_TIER,
    }),
  ],
  { includeBundled: true },
);

let stack: TestStack;
const PLATFORM_TENANT = "00000000-0000-4000-8000-000000000001";
const sysadmin = createTestUser({
  id: "platform-sysadmin",
  tenantId: PLATFORM_TENANT,
  roles: ["SystemAdmin"],
});

beforeAll(async () => {
  stack = await setupTestStack({ features });
  await unsafePushTables(stack.db, {
    config_values: configValuesTable,
    users: userTable,
    tenants: tenantTable,
    tenant_memberships: tenantMembershipsTable,
    tier_assignments: tierAssignmentTable,
  });

  wireSubscriptionWebhookRoute(stack.app, {
    db: stack.db,
    registry: stack.registry,
    dispatchSystemWrite: async ({ handlerQn, payload, tenantId }) => {
      const systemUser = createTestUser({
        id: "billing-system",
        tenantId,
        roles: ["SystemAdmin"],
      });
      const res = await stack.http.write(handlerQn, payload, systemUser);
      const body = (await res.json()) as {
        isSuccess: boolean;
        data?: unknown;
        error?: { code?: string; message?: string };
      };
      return body.isSuccess
        ? { isSuccess: true, data: body.data }
        : { isSuccess: false, error: body.error };
    },
  });
});

afterAll(async () => stack?.cleanup());

async function createTenant(key: string): Promise<TenantId> {
  const data = (await stack.http.writeOk<Record<string, unknown>>(
    TenantHandlers.create,
    { key, name: key },
    sysadmin,
  ))!;
  return data.id as TenantId;
}

function buildStripeSubscriptionEvent(overrides: {
  eventId: string;
  tenantId: string;
  priceId?: string;
  status?: string;
  eventType?: string;
}): string {
  return JSON.stringify({
    id: overrides.eventId,
    object: "event",
    api_version: "2026-04-22.dahlia",
    created: 1_770_000_000,
    type: overrides.eventType ?? "customer.subscription.created",
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: "sub_sp_001",
        object: "subscription",
        customer: "cus_sp_001",
        status: overrides.status ?? "active",
        metadata: { tenantId: overrides.tenantId },
        items: {
          object: "list",
          data: [
            {
              id: "si_sp",
              object: "subscription_item",
              current_period_end: 1_780_000_000,
              price: { id: overrides.priceId ?? "price_starter_sp", object: "price" },
            },
          ],
          has_more: false,
        },
      },
    },
  });
}

async function postSignedWebhook(payload: string, secret = TEST_SECRET): Promise<Response> {
  const sig = await stripeForFixtures.webhooks.generateTestHeaderStringAsync({ payload, secret });
  return stack.app.request("/webhooks/subscription/stripe", {
    method: "POST",
    body: payload,
    headers: { "stripe-signature": sig, "content-type": "application/json" },
  });
}

describe("show-pony billing webhook → tier-sync", () => {
  test("subscription.created (starter) sets tier-assignment=starter", async () => {
    const tenantId = await createTenant("sp-billing-starter");
    expect(await resolveTier(stack.db, tenantId)).toBe("free");

    const res = await postSignedWebhook(
      buildStripeSubscriptionEvent({ eventId: "evt_sp_created_1", tenantId }),
    );
    expect(res.status).toBe(200);
    expect(await resolveTier(stack.db, tenantId)).toBe("starter");
  });

  test("subscription canceled → tier falls back to free", async () => {
    const tenantId = await createTenant("sp-billing-cancel");
    await postSignedWebhook(
      buildStripeSubscriptionEvent({
        eventId: "evt_sp_cancel_1",
        tenantId,
        priceId: "price_pro_sp",
      }),
    );
    expect(await resolveTier(stack.db, tenantId)).toBe("pro");

    const canceled = await postSignedWebhook(
      buildStripeSubscriptionEvent({
        eventId: "evt_sp_cancel_2",
        tenantId,
        priceId: "price_pro_sp",
        eventType: "customer.subscription.deleted",
        status: "canceled",
      }),
    );
    expect(canceled.status).toBe(200);
    expect(await resolveTier(stack.db, tenantId)).toBe("free");
  });

  test("legacy tenant without tier row → create fallback", async () => {
    const tenantId = await createTenant("sp-billing-legacy");
    await deleteRows(stack.db, tierAssignmentTable, { tenantId });

    const res = await postSignedWebhook(
      buildStripeSubscriptionEvent({
        eventId: "evt_sp_legacy_1",
        tenantId,
        priceId: "price_pro_sp",
      }),
    );
    expect(res.status).toBe(200);
    expect(await resolveTier(stack.db, tenantId)).toBe("pro");
    expect(await countWhere(stack.db, tierAssignmentTable, { tenantId })).toBe(1);
  });
});


