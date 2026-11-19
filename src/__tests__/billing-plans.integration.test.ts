// Integration test for show-pony's billing-plans catalog wiring — the
// catalog-derived query/checkout/switch/portal flow against a FW stub "stripe"
// provider (no real Stripe network calls).

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type {
  BillingPlansResult,
  SubscriptionEvent,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import {
  BillingPlanActions,
  SubscriptionFoundationHandlers,
  SubscriptionFoundationQueries,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { createStubSubscriptionProvider } from "@cosmicdrift/kumiko-bundled-features/billing-foundation/testing";
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
import { setupAppTestStack } from "@cosmicdrift/kumiko-dev-server/testing";
import type { ExtraRouteDefinition } from "@cosmicdrift/kumiko-framework/api";
import { createTenantDb } from "@cosmicdrift/kumiko-framework/db";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import { createTestUser } from "@cosmicdrift/kumiko-framework/seeding";
import { resolveBillingOption } from "@cosmicdrift/kumiko-server-runtime";
import { type TestStack, unsafePushTables } from "@cosmicdrift/kumiko-testing/stack";
import { buildShowPonyBillingOption } from "../features/show-pony/billing/billing-option";
import { createShowPonyBillingFoundationFeature } from "../features/show-pony/billing/plan-catalog";
import { DEFAULT_TIER, SHOWPONY_TIER_MAP } from "../features/show-pony/tier-map";
import { resolveTier, tierAssignmentTable } from "../features/show-pony/tier-resolver";

const BASE_URL = "https://show-pony.test";
const BILLING_PAGE_URL = `${BASE_URL}/host/billing`;
const PRICE_TO_TIER: Readonly<Record<string, "starter" | "pro">> = {
  price_starter_sp: "starter",
  price_pro_sp: "pro",
};
function prodWebhookRoute(): ExtraRouteDefinition {
  const billing = buildShowPonyBillingOption(PRICE_TO_TIER);
  if (!billing) throw new Error("test fixture: PRICE_TO_TIER must not be empty");
  return resolveBillingOption(billing, {}).route;
}
const stripeStub = createStubSubscriptionProvider({
  providerName: "stripe",
  featureName: "test-mock-stripe",
  plans: [
    { tier: "starter", priceId: "price_starter_sp", unitAmount: 900 },
    { tier: "pro", priceId: "price_pro_sp", unitAmount: 2900 },
  ],
  overrides: {
    verifyAndParseWebhook: async (rawBody) => JSON.parse(rawBody) as SubscriptionEvent,
  },
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
      stripeStub.feature,
    ],
    { extraRoutes: [prodWebhookRoute()] },
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
  stripeStub.resetCalls();
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

// The catalog's purchaseRoles is ["Admin"] only — a pure Admin (no
// TenantAdmin) must still be able to purchase/manage billing.
function adminOnlyUser(tenantId: TenantId) {
  return createTestUser({ id: `admin-only-${tenantId}`, tenantId, roles: ["Admin"] });
}

function tenantAdminOnlyUser(tenantId: TenantId) {
  return createTestUser({ id: `tenant-admin-only-${tenantId}`, tenantId, roles: ["TenantAdmin"] });
}

function memberUser(tenantId: TenantId) {
  return createTestUser({ id: `member-${tenantId}`, tenantId, roles: ["Member"] });
}

function subscriptionEvent(overrides: {
  providerEventId: string;
  tenantId: string;
  type: "subscription.created" | "subscription.updated" | "subscription.canceled";
  status: "active" | "canceled";
  priceId: string;
  cancelAt?: string | null;
  providerCheckoutId?: string;
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
    ...(overrides.cancelAt !== undefined && { cancelAt: overrides.cancelAt }),
    ...(overrides.providerCheckoutId !== undefined && {
      providerCheckoutId: overrides.providerCheckoutId,
    }),
  };
}

async function recordCheckoutOpened(tenantId: TenantId, priceId: string): Promise<string> {
  const providerCheckoutId = `cs_mock_${tenantId}_${priceId}`;
  await stack.http.writeOk(
    SubscriptionFoundationHandlers.recordCheckoutOpened,
    { providerName: "stripe", providerCheckoutId, priceId, mode: "subscription" },
    createTestUser({ id: `sysadmin-${tenantId}`, tenantId, roles: ["SystemAdmin"] }),
  );
  return providerCheckoutId;
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
      SubscriptionFoundationQueries.billingPlans,
      {},
      memberUser(tenantId),
    );
    expect(error.httpStatus).toBe(403);
  });

  test("an Admin sees both plans priced with checkout actions on a fresh tenant", async () => {
    const tenantId = await createTenant("sp-bp-a2");
    const result = await stack.http.queryOk<BillingPlansResult>(
      SubscriptionFoundationQueries.billingPlans,
      {},
      adminUser(tenantId),
    );
    expect(result.currentTier.tier).toBe("free");
    const starter = result.plans.find((p) => p.tier === "starter");
    const pro = result.plans.find((p) => p.tier === "pro");
    expect(starter?.action).toBe(BillingPlanActions.checkout);
    expect(starter?.price?.unitAmount).toBe(900);
    expect(pro?.action).toBe(BillingPlanActions.checkout);
    expect(pro?.price?.unitAmount).toBe(2900);
  });
});

// =============================================================================
// b. checkout
// =============================================================================

describe("start-plan-checkout", () => {
  test("starter checkout resolves the show-pony price + baseUrl-origin URLs", async () => {
    const tenantId = await createTenant("sp-bp-b1");
    const result = await stack.http.writeOk<{ url: string }>(
      SubscriptionFoundationHandlers.startPlanCheckout,
      { tier: "starter" },
      adminUser(tenantId),
    );

    expect(result.url).toBe(BILLING_PAGE_URL);
    expect(stripeStub.calls.checkout).toHaveLength(1);
    expect(stripeStub.calls.checkout[0]).toMatchObject({
      priceId: "price_starter_sp",
      successUrl: BILLING_PAGE_URL,
      cancelUrl: BILLING_PAGE_URL,
    });
  });
});

// =============================================================================
// c. switch
// =============================================================================

describe("switch-plan", () => {
  test("switching an active starter subscription to pro calls createPlanSwitchSession", async () => {
    const tenantId = await createTenant("sp-bp-c1");
    const providerCheckoutId = await recordCheckoutOpened(tenantId, "price_starter_sp");
    const created = await postWebhook(
      subscriptionEvent({
        providerEventId: `evt_${tenantId}_created`,
        tenantId,
        type: "subscription.created",
        status: "active",
        priceId: "price_starter_sp",
        providerCheckoutId,
      }),
    );
    expect(created.status).toBe(200);
    expect(await resolveTier(createTenantDb({ db: stack.db, tenantId }))).toBe("starter");

    const result = await stack.http.writeOk<{ url: string }>(
      SubscriptionFoundationHandlers.switchPlan,
      { tier: "pro" },
      adminUser(tenantId),
    );

    expect(result.url).toBe(BILLING_PAGE_URL);
    expect(stripeStub.calls.planSwitch).toHaveLength(1);
    expect(stripeStub.calls.planSwitch[0]).toMatchObject({
      providerSubscriptionId: `sub_${tenantId}`,
      targetPriceId: "price_pro_sp",
      allowedPriceIds: expect.arrayContaining(["price_starter_sp", "price_pro_sp"]),
      returnUrl: BILLING_PAGE_URL,
    });
  });
});

// =============================================================================
// f. cancellation
// =============================================================================

describe("subscription cancellation", () => {
  test("a canceled webhook falls the tier back to free and re-opens checkout", async () => {
    const tenantId = await createTenant("sp-bp-f1");
    const providerCheckoutId = await recordCheckoutOpened(tenantId, "price_pro_sp");
    await postWebhook(
      subscriptionEvent({
        providerEventId: `evt_${tenantId}_created`,
        tenantId,
        type: "subscription.created",
        status: "active",
        priceId: "price_pro_sp",
        providerCheckoutId,
      }),
    );
    expect(await resolveTier(createTenantDb({ db: stack.db, tenantId }))).toBe("pro");

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
    expect(await resolveTier(createTenantDb({ db: stack.db, tenantId }))).toBe("free");

    const result = await stack.http.queryOk<BillingPlansResult>(
      SubscriptionFoundationQueries.billingPlans,
      {},
      adminUser(tenantId),
    );
    expect(result.currentTier.tier).toBe("free");
    expect(result.plans.find((p) => p.tier === "pro")?.action).toBe(BillingPlanActions.checkout);
  });
});

// =============================================================================
// g. a scheduled (not yet effective) cancellation
// =============================================================================

describe("subscription — pending cancellation", () => {
  test("a subscription.updated with a future cancelAt keeps the paid tier and stays non-terminal", async () => {
    const tenantId = await createTenant("sp-bp-g1");
    const providerCheckoutId = await recordCheckoutOpened(tenantId, "price_pro_sp");
    const created = await postWebhook(
      subscriptionEvent({
        providerEventId: `evt_${tenantId}_created`,
        tenantId,
        type: "subscription.created",
        status: "active",
        priceId: "price_pro_sp",
        providerCheckoutId,
      }),
    );
    expect(created.status).toBe(200);

    const updated = await postWebhook(
      subscriptionEvent({
        providerEventId: `evt_${tenantId}_cancel_scheduled`,
        tenantId,
        type: "subscription.updated",
        status: "active",
        priceId: "price_pro_sp",
        cancelAt: "2026-12-01T00:00:00Z",
      }),
    );
    expect(updated.status).toBe(200);
    expect(await resolveTier(createTenantDb({ db: stack.db, tenantId }))).toBe("pro");

    const result = await stack.http.queryOk<BillingPlansResult>(
      SubscriptionFoundationQueries.billingPlans,
      {},
      adminUser(tenantId),
    );
    expect(result.currentTier.tier).toBe("pro");
    expect(result.subscription?.cancelAt).toBe("2026-12-01T00:00:00Z");
    expect(result.subscription?.terminal).toBe(false);
  });
});

// =============================================================================
// h. free-tier defaults
// =============================================================================

describe("billing-plans — free tier defaults", () => {
  test("a fresh tenant's currentTier is free with the free event/guest benefits", async () => {
    const tenantId = await createTenant("sp-bp-h1");
    const result = await stack.http.queryOk<BillingPlansResult>(
      SubscriptionFoundationQueries.billingPlans,
      {},
      adminUser(tenantId),
    );
    expect(result.currentTier.tier).toBe("free");
    expect(result.currentTier.benefits).toEqual([
      { labelKey: "showpony:billing.benefit.event" },
      { labelKey: "showpony:billing.benefit.guests", params: { count: 50 } },
    ]);
  });
});

// =============================================================================
// i. create-portal-session
// =============================================================================

describe("create-portal-session", () => {
  test("a pure Admin (no TenantAdmin) with an active subscription opens the portal at the catalog's returnPath", async () => {
    const tenantId = await createTenant("sp-bp-i1");
    const providerCheckoutId = await recordCheckoutOpened(tenantId, "price_starter_sp");
    const created = await postWebhook(
      subscriptionEvent({
        providerEventId: `evt_${tenantId}_created`,
        tenantId,
        type: "subscription.created",
        status: "active",
        priceId: "price_starter_sp",
        providerCheckoutId,
      }),
    );
    expect(created.status).toBe(200);

    const result = await stack.http.writeOk<{ url: string }>(
      SubscriptionFoundationHandlers.createPortalSession,
      {},
      adminOnlyUser(tenantId),
    );
    expect(result.url).toBe(BILLING_PAGE_URL);
    expect(stripeStub.calls.portal).toHaveLength(1);
    expect(stripeStub.calls.portal[0]).toMatchObject({ returnUrl: BILLING_PAGE_URL });
  });

  test("an extra field is rejected by the strict {} schema", async () => {
    const tenantId = await createTenant("sp-bp-i2");
    const providerCheckoutId = await recordCheckoutOpened(tenantId, "price_starter_sp");
    const created = await postWebhook(
      subscriptionEvent({
        providerEventId: `evt_${tenantId}_created`,
        tenantId,
        type: "subscription.created",
        status: "active",
        priceId: "price_starter_sp",
        providerCheckoutId,
      }),
    );
    expect(created.status).toBe(200);

    const error = await stack.http.writeErr(
      SubscriptionFoundationHandlers.createPortalSession,
      { returnUrl: "https://evil.example" },
      adminOnlyUser(tenantId),
    );
    expect(error.httpStatus).toBe(400);
  });

  test("a TenantAdmin-only or Member user is rejected", async () => {
    const tenantId = await createTenant("sp-bp-i3");
    const tenantAdminError = await stack.http.writeErr(
      SubscriptionFoundationHandlers.createPortalSession,
      {},
      tenantAdminOnlyUser(tenantId),
    );
    expect(tenantAdminError.httpStatus).toBe(403);

    const memberError = await stack.http.writeErr(
      SubscriptionFoundationHandlers.createPortalSession,
      {},
      memberUser(tenantId),
    );
    expect(memberError.httpStatus).toBe(403);
  });
});
