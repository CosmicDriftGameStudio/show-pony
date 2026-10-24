// Anonymous queries share one anonymous user id, so their rate limit must
// bucket per client IP and per handler. Proven with real HTTP calls against
// the real Redis-backed limiter: one IP exhausts event:by-slug, but its
// invite-branding bucket and a second IP's event:by-slug bucket stay open.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createInMemoryTransport } from "@cosmicdrift/kumiko-bundled-features/channel-email";
import {
  createConfigAccessorFactory,
  createConfigFeature,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { createManagedPagesFeature } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-dev-server/testing";
import { type TestStack, unsafePushTables } from "@cosmicdrift/kumiko-testing/stack";
import { showPonyFeature } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { deliveryFeatures } from "./delivery-stack";
import { hostRoutingAnonymousAccess, hostRoutingFeatures } from "./host-routing-stack";

const BASE_DOMAIN = "show-pony.test";
const LIMIT = 60;
const FROZEN_NOW_MS = Date.UTC(2026, 9, 23, 12);
const configResolver = createConfigResolver();

let stack: TestStack;
let hostname: string;

function anonymousQuery(type: string, payload: Record<string, unknown>, clientIp: string) {
  return stack.http.raw(
    "POST",
    "/api/query",
    { type, payload },
    { Host: hostname, "x-forwarded-for": clientIp },
  );
}

const bySlug = (clientIp: string) =>
  anonymousQuery("showpony:query:event:by-slug", { slug: "no-such-event" }, clientIp);
const branding = (clientIp: string) =>
  anonymousQuery("showpony:query:invite-branding", {}, clientIp);

beforeAll(async () => {
  stack = await setupAppTestStack(
    [
      ...hostRoutingFeatures(BASE_DOMAIN),
      createConfigFeature(),
      createManagedPagesFeature({ resolveApexTenant: async () => null }),
      ...deliveryFeatures(createInMemoryTransport()),
      showPonyFeature,
    ],
    {
      ...hostRoutingAnonymousAccess,
      extraContext: ({ registry }) => ({
        configResolver,
        configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
      }),
      // Honour x-forwarded-for so each test caller gets its own IP bucket.
      trustedProxyHops: 1,
      // A frozen clock keeps the bucket from refilling while the loop runs, however slow the requests are.
      rateLimitNowMs: () => FROZEN_NOW_MS,
    },
  );
  await unsafePushTables(stack.db, { tier_assignments: tierAssignmentTable });
  const tenant = await seedTenant(stack, { name: "Rate Limit Host", persist: true });
  hostname = `${tenant.key}.${BASE_DOMAIN}`;
});

afterAll(async () => stack?.cleanup());

describe("anonymous handlers rate-limit per IP and per handler", () => {
  test("event:by-slug blocks the limit+1th call from one IP; other handler and other IP stay open", async () => {
    const ip = "198.51.100.10";
    for (let i = 0; i < LIMIT; i++) {
      const res = await bySlug(ip);
      expect(res.status).toBe(200);
    }
    const blocked = await bySlug(ip);
    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as { error: { code: string } };
    expect(body.error.code).toBe("rate_limited");

    // Same IP, other handler: separate bucket.
    expect((await branding(ip)).status).toBe(200);
    // Other IP, same handler: separate bucket.
    expect((await bySlug("198.51.100.11")).status).toBe(200);
  });
});
