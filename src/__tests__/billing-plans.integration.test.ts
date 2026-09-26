// Integration test for show-pony's billing-plans catalog wiring — the
// catalog-derived query/checkout/switch flow against a mock "stripe"
// provider (no real Stripe network calls), plus the raw platform-level
// create-checkout-session hardening (redirect-origin + unknown-price) that
// show-pony itself never calls directly (its own Admin-role users go
// through start-plan-checkout/switch-plan instead).

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type {
  SubscriptionEvent,
  SubscriptionProviderPlugin,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { SubscriptionFoundationHandlers } from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { createComplianceProfilesFeature } from "@cosmicdrift/kumiko-bundled-features/compliance-profiles";
import { configValuesTable } from "@cosmicdrift/kumiko-bundled-features/config";
import { createSecretsFeature } from "@cosmicdrift/kumiko-bundled-features/secrets";
import {
  TenantHandlers,
  tenantMembershipsTable,
  tenantTable,
} from "@cosmicdrift/kumiko-bundled-features/tenant";
import { createTenantLifecycleFeature } from "@cosmicdrift/kumiko-bundled-features/tenant-lifecycle";
import { createTierEngineFeature } from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import { userTable } from "@cosmicdrift/kumiko-bundled-features/user";
import { createTenantDb } from "@cosmicdrift/kumiko-framework/db";
import { defineFeature, type TenantId } from "@cosmicdrift/kumiko-framework/engine";
import {
  createTestUser,
  type TestStack,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import { setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { createShowPonyBillingFoundationFeature } from "../features/show-pony/billing/plan-catalog";
import { buildSubscriptionWebhookRoute } from "../features/show-pony/billing/webhook-route";
import { DEFAULT_TIER, SHOWPONY_TIER_MAP } from "../features/show-pony/tier-map";
import { resolveTier, tierAssignmentTable } from "../features/show-pony/tier-resolver";

const BASE_URL = "https://show-pony.test";
const PRICE_TO_TIER: Readonly<Record<string, "starter" | "pro">> = {
  price_starter_sp: "starter",
  price_pro_sp: "pro",
};
const PRICE_UNIT_AMOUNTS: Readonly<Record<string, number>> = {
  price_starter_sp: 900,
  price_pro_sp: 2900,
};

const checkoutCalls: Array<{ priceId: string; successUrl: string; cancelUrl: string }> = [];
const switchCalls: Array<{
  providerSubscriptionId: string;
  targetPriceId: string;
  allowedPriceIds: readonly string[];
  returnUrl: string;
}> = [];

const mockStripePlugin: SubscriptionProviderPlugin = {
  verifyAndParseWebhook: async (rawBody) => JSON.parse(rawBody) as SubscriptionEvent,
  priceToTier: PRICE_TO_TIER,
  retrievePrices: async (_ctx, priceIds) =>
    priceIds.flatMap((priceId) => {
      const unitAmount = PRICE_UNIT_AMOUNTS[priceId];
      if (unitAmount === undefined) return [];
      return [
        {
          priceId,
          unitAmount,
          currency: "eur",
          interval: "month" as const,
          intervalCount: 1,
          active: true,
          metadata: {},
        },
      ];
    }),
  createCheckoutSession: async (_ctx, options) => {
    checkoutCalls.push({
      priceId: options.priceId,
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
    });
    return { url: `https://mock.stripe.test/checkout/${options.priceId}` };
  },
  createPlanSwitchSession: async (_ctx, options) => {
    switchCalls.push(options);
    return { url: `https://mock.stripe.test/switch/${options.targetPriceId}` };
  },
};

const mockStripeFeature = defineFeature("test-mock-stripe", (r) => {
  r.requires("billing-foundation");
  r.useExtension("subscriptionProvider", "stripe", mockStripePlugin);
});

let stack: TestStack;

const PLATFORM_TENANT = "00000000-0000-4000-8000-000000000001";
const sysadmin = createTestUser({
  id: "platform-sysadmin",
  tenantId: PLATFORM_TENANT,
  roles: ["SystemAdmin"],
});

beforeAll(async () => {
  stack = await setupAppTestStack(
    [
      createTierEngineFeature({ defaultTier: DEFAULT_TIER, tierMap: SHOWPONY_TIER_MAP }),
      createComplianceProfilesFeature(),
      createTenantLifecycleFeature(),
      createShowPonyBillingFoundationFeature(BASE_URL),
      createSecretsFeature(),
      mockStripeFeature,
    ],
    { extraRoutes: [buildSubscriptionWebhookRoute()] },
  );
  await unsafePushTables(stack.db, {
    config_values: configValuesTable,
    users: userTable,
    tenants: tenantTable,
    tenant_memberships: tenantMembershipsTable,
    tier_assignments: tierAssignmentTable,
  });
});

afterAll(async () => stack?.cleanup());

beforeEach(() => {
  checkoutCalls.length = 0;
  switchCalls.length = 0;
});

async function createTenant(key: string): Promise<TenantId> {
  const data = (await stack.http.writeOk<Record<string, unknown>>(
    TenantHandlers.create,
    { key, name: key },
    sysadmin,
  ))!;
  return data["id"] as TenantId;
}

function adminUser(tenantId: TenantId) {
  return createTestUser({ id: `admin-${tenantId}`, tenantId, roles: ["Admin", "TenantAdmin"] });
}

function memberUser(tenantId: TenantId) {
  return createTestUser({ id: `member-${tenantId}`, tenantId, roles: ["Member"] });
}

function subscriptionEvent(overrides: {
  providerEventId: string;
  tenantId: string;
  type: "subscription.created" | "subscription.canceled";
  status: "active" | "canceled";
  priceId: string;
}): SubscriptionEvent {
  const tier = PRICE_TO_TIER[overrides.priceId];
  if (!tier) throw new Error(`test fixture: unknown priceId "${overrides.priceId}"`);
  return {
    providerEventId: overrides.providerEventId,
    providerName: "stripe",
    type: overrides.type,
    tenantId: overrides.tenantId,
    providerCustomerId: `cus_${overrides.tenantId}`,
    providerSubscriptionId: `sub_${overrides.tenantId}`,
    status: overrides.status,
    tier,
    currentPeriodEnd: "2026-12-01T00:00:00Z",
    rawPayload: "{}",
  };
}

async function postWebhook(event: SubscriptionEvent): Promise<Response> {
  return stack.app.request("/webhooks/subscription/stripe", {
    method: "POST",
    body: JSON.stringify(event),
    headers: { "content-type": "application/json" },
  });
}

// =============================================================================
// a. admin-only access
// =============================================================================

describe("billing-plans query — access", () => {
  test("a non-Admin tenant member is rejected", async () => {
    const tenantId = await createTenant("sp-bp-a1");
    const error = await stack.http.queryErr(
      "billing-foundation:query:billing-plans",
      {},
      memberUser(tenantId),
    );
    expect(error.httpStatus).toBe(403);
  });

  test("an Admin sees both plans priced with checkout actions on a fresh tenant", async () => {
    const tenantId = await createTenant("sp-bp-a2");
    const result = (await stack.http.queryOk(
      "billing-foundation:query:billing-plans",
      {},
      adminUser(tenantId),
    )) as {
      currentTier: { tier: string };
      plans: Array<{ tier: string; action: string; price: { unitAmount: number } | null }>;
    };
    expect(result.currentTier.tier).toBe("free");
    const starter = result.plans.find((p) => p.tier === "starter");
    const pro = result.plans.find((p) => p.tier === "pro");
    expect(starter?.action).toBe("checkout");
    expect(starter?.price?.unitAmount).toBe(900);
    expect(pro?.action).toBe("checkout");
    expect(pro?.price?.unitAmount).toBe(2900);
  });
});

// =============================================================================
// b. checkout
// =============================================================================

describe("start-plan-checkout", () => {
  test("starter checkout resolves the show-pony price + baseUrl-origin URLs", async () => {
    const tenantId = await createTenant("sp-bp-b1");
    const result = (await stack.http.writeOk(
      SubscriptionFoundationHandlers.startPlanCheckout,
      { tier: "starter" },
      adminUser(tenantId),
    )) as { url: string };

    expect(result.url).toBe("https://mock.stripe.test/checkout/price_starter_sp");
    expect(checkoutCalls).toHaveLength(1);
    expect(checkoutCalls[0]).toEqual({
      priceId: "price_starter_sp",
      successUrl: "https://show-pony.test/host/billing",
      cancelUrl: "https://show-pony.test/host/billing",
    });
  });
});

// =============================================================================
// c. switch
// =============================================================================

describe("switch-plan", () => {
  test("switching an active starter subscription to pro calls createPlanSwitchSession", async () => {
    const tenantId = await createTenant("sp-bp-c1");
    const created = await postWebhook(
      subscriptionEvent({
        providerEventId: `evt_${tenantId}_created`,
        tenantId,
        type: "subscription.created",
        status: "active",
        priceId: "price_starter_sp",
      }),
    );
    expect(created.status).toBe(200);
    expect(await resolveTier(createTenantDb(stack.db, tenantId, "system"), tenantId)).toBe(
      "starter",
    );

    const result = (await stack.http.writeOk(
      SubscriptionFoundationHandlers.switchPlan,
      { tier: "pro" },
      adminUser(tenantId),
    )) as { url: string };

    expect(result.url).toBe("https://mock.stripe.test/switch/price_pro_sp");
    expect(switchCalls).toHaveLength(1);
    expect(switchCalls[0]).toEqual({
      providerSubscriptionId: `sub_${tenantId}`,
      targetPriceId: "price_pro_sp",
      allowedPriceIds: expect.arrayContaining(["price_starter_sp", "price_pro_sp"]),
      returnUrl: "https://show-pony.test/host/billing",
    });
  });
});

// =============================================================================
// d/e. security hardening on the raw platform create-checkout-session
// handler — show-pony's own Admin users never call this directly (they go
// through start-plan-checkout/switch-plan), but the platform-level guard
// still applies once a caller has the handler's own required role.
// =============================================================================

describe("create-checkout-session — hardening (not show-pony's own call path)", () => {
  test("d. a foreign redirect origin is rejected even for a known priceId", async () => {
    const tenantId = await createTenant("sp-bp-d1");
    const error = await stack.http.writeErr(
      "billing-foundation:write:create-checkout-session",
      {
        providerName: "stripe",
        priceId: "price_starter_sp",
        successUrl: "https://evil.example/success",
        cancelUrl: "https://evil.example/cancel",
      },
      adminUser(tenantId),
    );
    expect(error.httpStatus).toBe(422);
    expect(error.i18nKey).toBe("billing-foundation.errors.redirectOriginNotAllowed");
    expect(error.details).toMatchObject({ reason: "redirect_origin_not_allowed" });
  });

  test("e. an unknown priceId is rejected on an allowed origin", async () => {
    const tenantId = await createTenant("sp-bp-e1");
    const error = await stack.http.writeErr(
      "billing-foundation:write:create-checkout-session",
      {
        providerName: "stripe",
        priceId: "price_unknown_xyz",
        successUrl: "https://show-pony.test/host/billing",
        cancelUrl: "https://show-pony.test/host/billing",
      },
      adminUser(tenantId),
    );
    expect(error.httpStatus).toBe(422);
    expect(error.i18nKey).toBe("billing-foundation.errors.unknownPrice");
    expect(error.details).toMatchObject({ reason: "unknown_price" });
  });
});

// =============================================================================
// f. cancellation
// =============================================================================

describe("subscription cancellation", () => {
  test("a canceled webhook falls the tier back to free and re-opens checkout", async () => {
    const tenantId = await createTenant("sp-bp-f1");
    await postWebhook(
      subscriptionEvent({
        providerEventId: `evt_${tenantId}_created`,
        tenantId,
        type: "subscription.created",
        status: "active",
        priceId: "price_pro_sp",
      }),
    );
    expect(await resolveTier(createTenantDb(stack.db, tenantId, "system"), tenantId)).toBe("pro");

    const canceled = await postWebhook(
      subscriptionEvent({
        providerEventId: `evt_${tenantId}_canceled`,
        tenantId,
        type: "subscription.canceled",
        status: "canceled",
        priceId: "price_pro_sp",
      }),
    );
    expect(canceled.status).toBe(200);
    expect(await resolveTier(createTenantDb(stack.db, tenantId, "system"), tenantId)).toBe("free");

    const result = (await stack.http.queryOk(
      "billing-foundation:query:billing-plans",
      {},
      adminUser(tenantId),
    )) as { currentTier: { tier: string }; plans: Array<{ tier: string; action: string }> };
    expect(result.currentTier.tier).toBe("free");
    expect(result.plans.find((p) => p.tier === "pro")?.action).toBe("checkout");
  });
});
