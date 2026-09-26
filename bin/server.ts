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

import {
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { createSubscriptionStripeFeature } from "@cosmicdrift/kumiko-bundled-features/subscription-stripe";
import { createTemplateResolverApi } from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import { runDevApp } from "@cosmicdrift/kumiko-dev-server";
import type { ExtraRouteDefinition } from "@cosmicdrift/kumiko-framework/api";
import { resolveKmsWiring } from "@cosmicdrift/kumiko-framework/crypto";
import { createMeilisearchAdapter } from "@cosmicdrift/kumiko-framework/search/meilisearch";
import {
  createE2eSeedRoutes,
  isE2eSeedingEnabled,
} from "@cosmicdrift/kumiko-testing/e2e/seed-route";
import { buildDemoModeRoutes } from "../src/demo-mode-routes";
import { buildSubscriptionWebhookRoute } from "../src/features/show-pony/billing/webhook-route";
import { buildTermsRoutes } from "../src/legal-terms";
import { dispatchShowPonyApexStaticDev } from "../src/marketing/locale-routes";
import { renderAllMarketingPages } from "../src/marketing/render-landing";
import { buildAppFeatures } from "../src/run-config";
import { bindSubdomainPageResolver, hostnameOf } from "../src/tenant-routing";
import { ACME_TENANT, DEMO_TENANT, seedSysadmin } from "./demo-tenants";
import { createE2eBillingStubFeature, e2eBillingExtraSeeders } from "./e2e-billing-stub";
import { configureAllTenantSearchIndexes } from "./search-wiring";
import { seedLegalContent } from "./seed-legal-content";
import { buildStripeBillingConfig, hasConfiguredPrices } from "./stripe-billing-env";

const BASE_DOMAIN = process.env["BASE_DOMAIN"] ?? "show-pony.localhost";
const port = Number.parseInt(process.env["PORT"] ?? "4180", 10);
const DEV_ORIGIN = `http://${BASE_DOMAIN}:${port}`;

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

await renderAllMarketingPages(DEV_ORIGIN);

const stripeBilling = buildStripeBillingConfig({
  STRIPE_API_KEY: process.env["STRIPE_API_KEY"],
  STRIPE_WEBHOOK_SECRET: process.env["STRIPE_WEBHOOK_SECRET"],
  STRIPE_PRICE_STARTER: process.env["STRIPE_PRICE_STARTER"],
  STRIPE_PRICE_PRO: process.env["STRIPE_PRICE_PRO"],
});

const searchAdapter = createMeilisearchAdapter({
  url: process.env["MEILI_URL"] ?? "http://localhost:17700",
  apiKey: process.env["MEILI_MASTER_KEY"] ?? "kumiko-dev-key",
});

const isAssetName = (file: string) => /^[a-zA-Z0-9_-]+\.(png|webp|svg|jpe?g)$/.test(file);
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
  // biome-ignore lint/suspicious/noConsole: intentional operator-visible plaintext-PII boot warning
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
      : [
          createSubscriptionStripeFeature({
            ...(stripeBilling.webhookSecret !== undefined && {
              webhookSecret: stripeBilling.webhookSecret,
            }),
            ...(stripeBilling.apiKey !== undefined && { apiKey: stripeBilling.apiKey }),
            priceToTier: stripeBilling.priceToTier,
          }),
        ]),
  ],
  port,
  clientEntries: [
    { name: "admin", sourceFile: "./src/client-admin.tsx", htmlPath: "./public/admin.html" },
    { name: "public", sourceFile: "./src/client-public.tsx", htmlPath: "./public/index.html" },
  ],
  htmlPath: "./public/index.html",
  hostDispatch: (req) => {
    const host = hostnameOf(req.headers.get("host") ?? "");
    const path = new URL(req.url).pathname;
    if (host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`) {
      const dispatched = dispatchShowPonyApexStaticDev(path);
      if (dispatched !== null) return dispatched;
      return { kind: "html", entryName: "admin", injectSchema: true };
    }
    return { kind: "html", entryName: "public", injectSchema: false };
  },
  watchDirs: ["./src", "./bin"],
  // Tenant resolve/exists: show-pony-tenant-routing feature (#1374).
  anonymousAccess: ({ db }) => {
    bindSubdomainPageResolver({ db, baseDomain: BASE_DOMAIN });
    return {};
  },
  extraContext: ({ registry, db }) => ({
    configResolver,
    _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    templateResolver: createTemplateResolverApi(db),
    searchAdapter,
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
      // running) — a dev/CI boot without it should degrade to an inert
      // search box, not crash the whole server. Sweeps all tenants (not
      // just DEMO/ACME) so any tenant seeded later stays covered too.
      try {
        await configureAllTenantSearchIndexes(stack.db, stack.registry, searchAdapter);
      } catch (err) {
        console.warn(`[search] Meilisearch unreachable, search index not configured: ${err}`);
      }
    },
    async (stack) => {
      await seedLegalContent(stack.db);
    },
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
    ...buildDemoModeRoutes(port),
    ...buildTermsRoutes(),
    ...(!isE2eSeedingEnabled() && hasConfiguredPrices(stripeBilling)
      ? [buildSubscriptionWebhookRoute()]
      : []),
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
