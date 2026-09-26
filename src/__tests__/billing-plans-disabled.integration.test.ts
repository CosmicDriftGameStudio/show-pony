// Stripe is always mounted (0.318.0 hardening — no priceToTier-presence
// gate), even with an empty priceToTier and billingLive off. The full app
// boots and the billing-plans query resolves `enabled: false` instead of
// throwing an UnconfiguredError from resolveCatalogProvider.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createSubscriptionStripeFeature } from "@cosmicdrift/kumiko-bundled-features/subscription-stripe";
import { createTestUser, type TestStack } from "@cosmicdrift/kumiko-framework/stack";
import { setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { buildAppFeatures } from "../run-config";

let stack: TestStack;

beforeAll(async () => {
  stack = await setupAppTestStack([
    ...buildAppFeatures({ baseDomain: "show-pony.test", appBaseUrl: "https://show-pony.test" }),
    createSubscriptionStripeFeature({ priceToTier: {} }),
  ]);
});

afterAll(async () => stack?.cleanup());

describe("billing disabled — Stripe mounted with no configured prices", () => {
  test("billing-plans query resolves enabled:false, no throw", async () => {
    const admin = createTestUser({
      id: "disabled-admin",
      tenantId: "00000000-0000-4000-8000-000000000002",
      roles: ["Admin"],
    });
    const result = (await stack.http.queryOk(
      "billing-foundation:query:billing-plans",
      {},
      admin,
    )) as { enabled: boolean };
    expect(result.enabled).toBe(false);
  });
});
