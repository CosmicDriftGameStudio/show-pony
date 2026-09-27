// bin/main.ts and bin/server.ts only mount createSubscriptionStripeFeature
// when hasConfiguredPrices is true — no provider mounted at all here, same
// as show-pony boots with no STRIPE_PRICE_* env set. billing-plans still
// resolves `enabled: false` instead of throwing (findCatalogProvider
// returns null, buildBillingPlans treats that like a disabled plugin), and
// every catalog write handler rejects with feature_disabled.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  type BillingPlansResult,
  SubscriptionFoundationHandlers,
  SubscriptionFoundationQueries,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { createTestUser, type TestStack } from "@cosmicdrift/kumiko-framework/stack";
import { setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { buildAppFeatures } from "../run-config";

let stack: TestStack;

beforeAll(async () => {
  stack = await setupAppTestStack([
    ...buildAppFeatures({ baseDomain: "show-pony.test", appBaseUrl: "https://show-pony.test" }),
  ]);
});

afterAll(async () => stack?.cleanup());

describe("billing disabled — no subscriptionProvider mounted", () => {
  test("billing-plans query resolves enabled:false, no throw", async () => {
    const admin = createTestUser({
      id: "disabled-admin",
      tenantId: "00000000-0000-4000-8000-000000000002",
      roles: ["Admin"],
    });
    const result = await stack.http.queryOk<BillingPlansResult>(
      SubscriptionFoundationQueries.billingPlans,
      {},
      admin,
    );
    expect(result.enabled).toBe(false);
  });

  test("start-plan-checkout rejects with feature_disabled", async () => {
    const admin = createTestUser({
      id: "disabled-admin-checkout",
      tenantId: "00000000-0000-4000-8000-000000000003",
      roles: ["Admin"],
    });
    const error = await stack.http.writeErr(
      SubscriptionFoundationHandlers.startPlanCheckout,
      { tier: "starter" },
      admin,
    );
    expect(error.httpStatus).toBe(403);
    expect(error.code).toBe("feature_disabled");
  });
});
