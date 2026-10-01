// Anonymous queries share one anonymous user id, so their rate limit must
// bucket per client IP and per handler. Proven with real HTTP calls against
// the real Redis-backed limiter: one IP exhausts event:by-slug, but its
// invite-branding bucket and a second IP's event:by-slug bucket stay open.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createConfigAccessorFactory,
  createConfigFeature,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { mailTransportInMemoryFeature } from "@cosmicdrift/kumiko-bundled-features/mail-transport-inmemory";
import { createManagedPagesFeature } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { type TestStack, unsafePushTables } from "@cosmicdrift/kumiko-framework/stack";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { showPonyFeature } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { createShowPonyAnonymousAccess } from "../tenant-routing";

const BASE_DOMAIN = "show-pony.test";
const LIMIT = 60;
const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

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
      createConfigFeature(),
      createManagedPagesFeature({ resolveApexTenant: async () => null }),
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    {
      anonymousAccess: ({ db }) => createShowPonyAnonymousAccess({ db, baseDomain: BASE_DOMAIN }),
      extraContext: ({ registry }) => ({
        configResolver,
        _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
      }),
      // Honour x-forwarded-for so each test caller gets its own IP bucket.
      trustedProxyHops: 1,
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
