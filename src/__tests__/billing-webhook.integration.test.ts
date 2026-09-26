import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SubscriptionFoundationQueries } from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { createComplianceProfilesFeature } from "@cosmicdrift/kumiko-bundled-features/compliance-profiles";
import { configValuesTable } from "@cosmicdrift/kumiko-bundled-features/config";
import { createSecretsFeature } from "@cosmicdrift/kumiko-bundled-features/secrets";
import { createSubscriptionStripeFeature } from "@cosmicdrift/kumiko-bundled-features/subscription-stripe";
import {
  TenantHandlers,
  tenantMembershipsTable,
  tenantTable,
} from "@cosmicdrift/kumiko-bundled-features/tenant";
import { createTenantLifecycleFeature } from "@cosmicdrift/kumiko-bundled-features/tenant-lifecycle";
import { createTierEngineFeature } from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import { userTable } from "@cosmicdrift/kumiko-bundled-features/user";
import { countWhere, createTenantDb } from "@cosmicdrift/kumiko-framework/db";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import {
  createTestUser,
  type TestStack,
  testTenantId,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import { setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import Stripe from "stripe";
import { createShowPonyBillingFoundationFeature } from "../features/show-pony/billing/plan-catalog";
import { buildSubscriptionWebhookRoute } from "../features/show-pony/billing/webhook-route";
import { DEFAULT_TIER, SHOWPONY_TIER_MAP } from "../features/show-pony/tier-map";
import { resolveTier, tierAssignmentTable } from "../features/show-pony/tier-resolver";

const TEST_SECRET = "whsec_test_showpony_billing";
const TEST_API_KEY = "sk_test_showpony_billing";
const PRICE_TO_TIER = { price_starter_sp: "starter", price_pro_sp: "pro" };

const stripeForFixtures = new Stripe(TEST_API_KEY);

const features = [
  createTierEngineFeature({ defaultTier: DEFAULT_TIER, tierMap: SHOWPONY_TIER_MAP }),
  createComplianceProfilesFeature(),
  createTenantLifecycleFeature(),
  createShowPonyBillingFoundationFeature("https://show-pony.test"),
  createSecretsFeature(),
  createSubscriptionStripeFeature({
    webhookSecret: TEST_SECRET,
    apiKey: TEST_API_KEY,
    priceToTier: PRICE_TO_TIER,
  }),
];

let stack: TestStack;

function tierResolverDb(tenantId: TenantId) {
  return createTenantDb(stack.db, tenantId, "system");
}
const PLATFORM_TENANT = "00000000-0000-4000-8000-000000000001";
const sysadmin = createTestUser({
  id: "platform-sysadmin",
  tenantId: PLATFORM_TENANT,
  roles: ["SystemAdmin"],
});

beforeAll(async () => {
  // The route's dispatchSystemWrite/dispatchSystemQuery now come from
  // buildServer's own SystemAdmin dispatcher (SignatureExtraRouteDeps),
  // built at request time — extraRoutes are mounted through setupTestStack
  // the same way runProdApp/runDevApp mount them.
  stack = await setupAppTestStack(features, { extraRoutes: [buildSubscriptionWebhookRoute()] });
  await unsafePushTables(stack.db, {
    config_values: configValuesTable,
    users: userTable,
    tenants: tenantTable,
    tenant_memberships: tenantMembershipsTable,
    tier_assignments: tierAssignmentTable,
  });
});

afterAll(async () => stack?.cleanup());

async function createTenant(key: string): Promise<TenantId> {
  const data = (await stack.http.writeOk<Record<string, unknown>>(
    TenantHandlers.create,
    { key, name: key },
    sysadmin,
  ))!;
  return data["id"] as TenantId;
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

async function postSignedWebhookTo(
  target: TestStack,
  payload: string,
  secret = TEST_SECRET,
): Promise<Response> {
  const sig = await stripeForFixtures.webhooks.generateTestHeaderStringAsync({ payload, secret });
  return target.app.request("/webhooks/subscription/stripe", {
    method: "POST",
    body: payload,
    headers: { "stripe-signature": sig, "content-type": "application/json" },
  });
}

async function postSignedWebhook(payload: string, secret = TEST_SECRET): Promise<Response> {
  return postSignedWebhookTo(stack, payload, secret);
}

describe("show-pony billing webhook → tier-sync", () => {
  test("subscription.created (starter) sets tier-assignment=starter", async () => {
    const tenantId = await createTenant("sp-billing-starter");
    expect(await resolveTier(tierResolverDb(tenantId), tenantId)).toBe("free");

    const res = await postSignedWebhook(
      buildStripeSubscriptionEvent({ eventId: "evt_sp_created_1", tenantId }),
    );
    expect(res.status).toBe(200);
    expect(await resolveTier(tierResolverDb(tenantId), tenantId)).toBe("starter");
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
    expect(await resolveTier(tierResolverDb(tenantId), tenantId)).toBe("pro");

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
    expect(await resolveTier(tierResolverDb(tenantId), tenantId)).toBe("free");
  });

  test("legacy tenant without tier row → create fallback", async () => {
    // testTenantId, not tenant:create: a real tenant already gets a
    // tier-assignment row from tenant-lifecycle's postSave, and deleting
    // that row while its event stream still exists hits version_conflict
    // on the next write. A tenant id with no stream at all reproduces the
    // actual "legacy tenant predates tier-engine" case cleanly.
    const tenantId = testTenantId(5001);

    const res = await postSignedWebhook(
      buildStripeSubscriptionEvent({
        eventId: "evt_sp_legacy_1",
        tenantId,
        priceId: "price_pro_sp",
      }),
    );
    expect(res.status).toBe(200);
    expect(await resolveTier(tierResolverDb(tenantId), tenantId)).toBe("pro");
    expect(await countWhere(stack.db, tierAssignmentTable, { tenantId })).toBe(1);
  });
});

// =============================================================================
// onSyncError: "fail-webhook" self-heal (show-pony's prod default, see
// webhook-route.ts). No dispatchSystemWrite mock survives the extraRoutes
// rewrite — the route's dispatcher is built by buildServer at request time,
// not test-injectable. A REAL, deterministic failure: a dedicated stack
// mounts the webhook route with tier_assignments deliberately left out of
// unsafePushTables, so the tier-sync step's own query/write throws a real
// "relation does not exist" error. Pushing the table afterwards and
// retrying the same event id proves the Stripe-replay self-heal (process-
// event's idempotent write is a no-op on retry, tier-sync gets a second,
// now-successful, shot) still holds once the underlying condition clears.
// =============================================================================
describe("tier-sync failure self-heals on Stripe retry", () => {
  let selfHealStack: TestStack;

  beforeAll(async () => {
    // registryTables: false — createTierEngineFeature registers tier_assignments
    // as an r.entity(), so the default auto-create would defeat this test's
    // premise (the table must be genuinely absent until the manual push below).
    selfHealStack = await setupAppTestStack(features, {
      extraRoutes: [buildSubscriptionWebhookRoute()],
      registryTables: false,
    });
    await unsafePushTables(selfHealStack.db, {
      config_values: configValuesTable,
      users: userTable,
      tenants: tenantTable,
      tenant_memberships: tenantMembershipsTable,
    });
  });

  afterAll(async () => selfHealStack?.cleanup());

  test("subscription write ok, tier-sync fails → 500, then self-heals once the table exists", async () => {
    const tenantId = testTenantId(5002);
    const eventPayload = buildStripeSubscriptionEvent({ eventId: "evt_sp_sync_fail_1", tenantId });

    const first = await postSignedWebhookTo(selfHealStack, eventPayload);
    expect(first.status).toBe(500);
    const firstBody = (await first.json()) as { error: { code?: string; message?: string } };
    expect(firstBody.error.code).toBe("subscription_webhook_processing_failed");

    // The primary write (process-event) committed even though the webhook
    // response failed — only the chained tier-sync step threw.
    const systemUser = createTestUser({ id: "billing-system", tenantId, roles: ["SystemAdmin"] });
    const listed = (await selfHealStack.http.queryOk(
      SubscriptionFoundationQueries.listSubscriptions,
      {},
      systemUser,
    )) as { rows: ReadonlyArray<Record<string, unknown>> };
    expect(listed.rows).toHaveLength(1);

    // Table now exists — the same Stripe retry (same event id) re-runs
    // process-event's idempotent write (no-op) and gets a second, this
    // time successful, shot at the tier-sync step.
    await unsafePushTables(selfHealStack.db, { tier_assignments: tierAssignmentTable });
    expect(await resolveTier(createTenantDb(selfHealStack.db, tenantId, "system"), tenantId)).toBe(
      "free",
    );

    const retried = await postSignedWebhookTo(selfHealStack, eventPayload);
    expect(retried.status).toBe(200);
    expect(await resolveTier(createTenantDb(selfHealStack.db, tenantId, "system"), tenantId)).toBe(
      "starter",
    );
  });
});
