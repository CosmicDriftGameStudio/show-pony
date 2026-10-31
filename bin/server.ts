// Local dev server for show-pony.
//
// Multi-tenant startup: one demo host tenant (key "demo") + admin login.
// The host manages events on the apex; a host's public RSVP page lives
// on their subdomain — anonymous writes are routed deterministically to
// the correct tenant via tenantResolver (Host header):
//
//   show-pony.localhost:4180        → apex: marketing + /login admin UI
//   demo.show-pony.localhost:4180   → public RSVP surface for the demo host
//
// *.localhost resolves to 127.0.0.1 in the browser automatically — no
// hosts file edit needed. Start with `bun dev`; requires Postgres + Redis.
//
//   admin@show-pony.local / changeme  — host account on the demo tenant

import { createConfigResolver } from "@cosmicdrift/kumiko-bundled-features/config";
import { legalContentSeed } from "@cosmicdrift/kumiko-bundled-features/legal-pages";
import { createSubscriptionStripeFeature } from "@cosmicdrift/kumiko-bundled-features/subscription-stripe";
import { runDevApp } from "@cosmicdrift/kumiko-dev-server";
import { createE2eSeedRoutes } from "@cosmicdrift/kumiko-dev-server/testing";
import type { ExtraRouteDefinition } from "@cosmicdrift/kumiko-framework/api";
import { resolveKmsWiring } from "@cosmicdrift/kumiko-framework/crypto";
import { isE2eSeedingEnabled } from "@cosmicdrift/kumiko-testing/e2e/seed-route";
import appConfig from "../kumiko.config";
import { buildSubscriptionWebhookRoute } from "../src/features/show-pony/billing/webhook-route";
import { priceToTierFromEnv } from "../src/features/show-pony/tier-map";
import legalContent from "../src/generated/legal-content.json";
import { createShowPonyDevHostDispatch } from "../src/host-dispatch";
import { renderAllMarketingPages } from "../src/marketing/render-landing";
import { buildAppFeatures, resolveBaseDomainFromEnv } from "../src/run-config";
import { isAssetName } from "./asset-name";
import { ACME_TENANT, DEMO_TENANT, seedSysadmin } from "./demo-tenants";
import { createE2eBillingStubFeature, e2eBillingExtraSeeders } from "./e2e-billing-stub";
import { buildShowPonyExtraContext } from "./extra-context";
import { createMeilisearchWiring, rebuildAllTenantSearchIndexes } from "./search-wiring";

const BASE_DOMAIN = resolveBaseDomainFromEnv();
const port = Number.parseInt(process.env["PORT"] ?? "4180", 10);
const DEV_ORIGIN = `http://${BASE_DOMAIN}:${port}`;

const configResolver = createConfigResolver();

await renderAllMarketingPages(DEV_ORIGIN);

const priceToTier = priceToTierFromEnv(process.env);
const stripeApiKey = process.env["STRIPE_API_KEY"];
const stripeWebhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
// Without any configured price billing-plans resolves enabled:false and checkout rejects with
// feature_disabled; the webhook route would drop every event anyway.
const hasConfiguredPrices = Object.keys(priceToTier).length > 0;

const searchWiring = createMeilisearchWiring({
  url: process.env["MEILI_URL"] ?? "http://localhost:17700",
  apiKey: process.env["MEILI_MASTER_KEY"] ?? "kumiko-dev-key",
  // The dev Meilisearch on 17700 is shared with other apps using the default
  // kumiko_ prefix; the boot rebuild drops every index under this prefix.
  indexPrefix: "showpony_dev_",
});

async function serveFromDir(dir: string, file: string): Promise<Response | null> {
  if (!isAssetName(file)) return null;
  const f = Bun.file(`./public/${dir}/${file}`);
  return (await f.exists()) ? new Response(f) : null;
}

const kmsWiring = resolveKmsWiring(process.env, {
  logPrefix: "[show-pony]",
  plaintextReason: "local dev without subject-keys KMS",
});
if ("allowPlaintextPii" in kmsWiring) {
  console.warn(`[show-pony] PII IS STORED IN PLAINTEXT — ${kmsWiring.allowPlaintextPii}`);
}

await runDevApp({
  ...("kms" in kmsWiring ? { kms: kmsWiring.kms, blindIndexKey: kmsWiring.blindIndexKey } : {}),
  features: [
    ...buildAppFeatures({ baseDomain: BASE_DOMAIN, appBaseUrl: DEV_ORIGIN }),
    // E2E screenshot runs stub Stripe out (no real Stripe network access) —
    // bin/main.ts never imports this stub, so prod always gets the real plugin.
    ...(isE2eSeedingEnabled()
      ? [createE2eBillingStubFeature()]
      : hasConfiguredPrices
        ? [
            createSubscriptionStripeFeature({
              ...(stripeWebhookSecret && { webhookSecret: stripeWebhookSecret }),
              ...(stripeApiKey && { apiKey: stripeApiKey }),
              priceToTier,
            }),
          ]
        : []),
  ],
  port,
  clientEntries: [
    { name: "admin", sourceFile: "./src/client-admin.tsx", htmlPath: "./public/admin.html" },
    { name: "public", sourceFile: "./src/client-public.tsx", htmlPath: "./public/index.html" },
  ],
  htmlPath: "./public/index.html",
  // Opt-in only: the host-routing provider fills tenantResolver/tenantExists, but never enables anonymous access.
  anonymousAccess: {},
  hostDispatch: createShowPonyDevHostDispatch(BASE_DOMAIN),
  ...(appConfig.validateBootOptions && { validateBootOptions: appConfig.validateBootOptions }),
  watchDirs: ["./src", "./bin"],
  extraContext: buildShowPonyExtraContext({
    baseDomain: BASE_DOMAIN,
    configResolver,
    searchAdapter: searchWiring.adapter,
  }),
  auth: {
    admin: {
      email: "admin@show-pony.local",
      password: "changeme",
      displayName: "Show-Pony Host",
      memberships: [
        {
          tenantId: DEMO_TENANT.id,
          tenantKey: DEMO_TENANT.tenantKey,
          tenantName: DEMO_TENANT.name,
          roles: ["Admin", "TenantAdmin"],
        },
        {
          tenantId: ACME_TENANT.id,
          tenantKey: ACME_TENANT.tenantKey,
          tenantName: ACME_TENANT.name,
          roles: ["Admin", "TenantAdmin"],
        },
      ],
    },
  },
  seeds: [
    async (stack) => {
      // Meilisearch is optional local/CI infra (docker compose, not always
      // running) — a boot without it must not crash the server. The adapter
      // stays wired, so search requests fail at runtime until Meilisearch is
      // reachable. Sweeps all tenants (not just DEMO/ACME).
      try {
        await rebuildAllTenantSearchIndexes(stack.db, stack.registry, searchWiring);
      } catch (err) {
        console.warn(`[search] search index rebuild failed: ${err}`);
      }
    },
    legalContentSeed({ blocks: legalContent }),
    async ({ db }) => {
      await seedSysadmin(db, {
        email: "sysadmin@show-pony.local",
        password: "changeme",
      });
    },
  ],
  extraRoutes: [
    // show-pony gates writes on its own "Admin" role; SEEDABLE_ROLES only covers TenantAdmin/Member.
    ...(isE2eSeedingEnabled()
      ? createE2eSeedRoutes({ extraRoles: ["Admin"], extraSeeders: e2eBillingExtraSeeders })
      : []),
    ...(!isE2eSeedingEnabled() && hasConfiguredPrices ? [buildSubscriptionWebhookRoute()] : []),
    ...(["screenshots", "logos", "heroes"] as const).map(
      (dir): ExtraRouteDefinition => ({
        method: "GET",
        path: `/${dir}/:file`,
        entry: "anonymous",
        handler: async (c) => {
          const file = c.req.param("file");
          const r = file ? await serveFromDir(dir, file) : null;
          return r ?? c.notFound();
        },
      }),
    ),
  ],
});
