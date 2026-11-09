import { describe, expect, test } from "bun:test";
import { SubscriptionFoundationHandlers } from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { TierEngineHandlers } from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import type { E2eSeederContext } from "@cosmicdrift/kumiko-testing/e2e/seed-route";
import { e2eBillingExtraSeeders } from "../e2e-billing-stub";

const TENANT_ID = "tenant-e2e" as TenantId;

type RecordedWrite = readonly [handlerQn: string, payload: unknown];

function createFakeContext(processEventResults: readonly unknown[]) {
  const writes: RecordedWrite[] = [];
  let processEventCalls = 0;
  const ctx: E2eSeederContext = {
    write: async (handlerQn, payload) => {
      writes.push([handlerQn, payload]);
      if (handlerQn === SubscriptionFoundationHandlers.processEvent) {
        return processEventResults[processEventCalls++];
      }
      return null;
    },
    query: async () => null,
    writeAs: async () => null,
  };
  return { ctx, writes };
}

function writesTo(writes: readonly RecordedWrite[], handlerQn: string): readonly RecordedWrite[] {
  return writes.filter(([qn]) => qn === handlerQn);
}

const seedSubscription = e2eBillingExtraSeeders["billing-subscription"];
if (!seedSubscription) throw new Error("billing-subscription seeder missing");

describe("billing-subscription seeder", () => {
  test("accepted events record the checkout price and set the paid tier", async () => {
    const { ctx, writes } = createFakeContext([{ ignored: false }]);

    await expect(
      seedSubscription(ctx, TENANT_ID, { tier: "pro", status: "active" }),
    ).resolves.toBeNull();

    const [checkout] = writesTo(writes, SubscriptionFoundationHandlers.recordCheckoutOpened);
    expect(checkout?.[1]).toMatchObject({ priceId: "price_e2e_pro" });
    const [tierWrite] = writesTo(writes, TierEngineHandlers.setTenantTier);
    expect(tierWrite?.[1]).toMatchObject({ tier: "pro" });
  });

  test("ignored created event fails the seed and leaves the tier untouched", async () => {
    const { ctx, writes } = createFakeContext([
      { ignored: true, reason: "checkout_not_in_ledger" },
    ]);

    await expect(
      seedSubscription(ctx, TENANT_ID, { tier: "pro", status: "active" }),
    ).rejects.toThrow("checkout_not_in_ledger");
    expect(writesTo(writes, TierEngineHandlers.setTenantTier)).toHaveLength(0);
  });

  test("ignored cancel-scheduled event fails the seed and leaves the tier untouched", async () => {
    const { ctx, writes } = createFakeContext([
      { ignored: false },
      { ignored: true, reason: "subscription_unknown" },
    ]);

    await expect(
      seedSubscription(ctx, TENANT_ID, { tier: "starter", status: "cancelScheduled" }),
    ).rejects.toThrow("subscription_unknown");
    expect(writesTo(writes, SubscriptionFoundationHandlers.processEvent)).toHaveLength(2);
    expect(writesTo(writes, TierEngineHandlers.setTenantTier)).toHaveLength(0);
  });
});
