// Production bootstrap for show-pony (Docker / any container host).
//
// Same shape as bin/server.ts (dev) but for production: runProdApp, https
// origins, env-driven admin + base domain.
//
// Required env: DATABASE_URL, REDIS_URL, JWT_SECRET, BASE_DOMAIN,
//   DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD (the names the Pulumi createKumikoApp
//   deploy helper injects). Optional: PORT (default 3000), BUILD_VERSION,
//   DEMO_READ_ONLY=true (live cloud demo — blocks /api/write, shows login hints).
//   BASE_DOMAIN is the host's surface, e.g. show-pony.kumiko.rocks — guest
//   pages live on <key>.<BASE_DOMAIN>.

import {
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { createSubscriptionStripeFeature } from "@cosmicdrift/kumiko-bundled-features/subscription-stripe";
import { createTemplateResolverApi } from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import { resolveKmsWiring } from "@cosmicdrift/kumiko-framework/crypto";
import { runProdApp } from "@cosmicdrift/kumiko-server-runtime";
import { withDemoReadOnlyFetch } from "../src/demo-mode";
import { wireDemoModeRoutes } from "../src/demo-mode-routes";
import { wireSubscriptionWebhookRoute } from "../src/features/show-pony/billing/webhook-route";
import { wireTermsRoutes } from "../src/legal-terms";
import { dispatchShowPonyApexStatic } from "../src/marketing/locale-routes";
import { renderAllMarketingPages } from "../src/marketing/render-landing";
import { buildAppFeatures } from "../src/run-config";
import { bindSubdomainPageResolver, hostnameOf } from "../src/tenant-routing";
import { ACME_TENANT, DEMO_TENANT, seedSysadmin } from "./demo-tenants";
import { seedLegalContent } from "./seed-legal-content";
import { buildStripeBillingConfig } from "./stripe-billing-env";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`show-pony: missing required env var ${name}`);
  return value;
}

const BASE_DOMAIN = required("BASE_DOMAIN");
const APEX_ORIGIN = `https://${BASE_DOMAIN}`;
const port = Number.parseInt(process.env["PORT"] ?? "3000", 10);

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

await renderAllMarketingPages(APEX_ORIGIN);

const stripeBilling = buildStripeBillingConfig({
  STRIPE_API_KEY: process.env["STRIPE_API_KEY"],
  STRIPE_WEBHOOK_SECRET: process.env["STRIPE_WEBHOOK_SECRET"],
  STRIPE_PRICE_STARTER: process.env["STRIPE_PRICE_STARTER"],
  STRIPE_PRICE_PRO: process.env["STRIPE_PRICE_PRO"],
});

// After the FIRST deploy that wires a real KMS here (kms/blindIndexKey below
// switch from the plaintext branch to actual credentials), run
// `bun bin/ops/backfill-pii.ts` once — pre-KMS RSVP guest events (name/email/
// note) stay plaintext in the event log otherwise, and crypto-shredding:
// write:forget-subject on one of them would report success without erasing
// anything (show-pony#130).
const kmsWiring = resolveKmsWiring(process.env, {
  logPrefix: "[show-pony]",
  plaintextReason: "show-pony demo app, no subject-keys KMS provisioned",
});
if ("allowPlaintextPii" in kmsWiring) {
  // biome-ignore lint/suspicious/noConsole: intentional operator-visible plaintext-PII boot warning
  console.warn(`[show-pony] PII IS STORED IN PLAINTEXT — ${kmsWiring.allowPlaintextPii}`);
}

const handle = await runProdApp({
  features: [
    ...buildAppFeatures({ baseDomain: BASE_DOMAIN }),
    ...(stripeBilling
      ? [
          createSubscriptionStripeFeature({
            ...(stripeBilling.webhookSecret !== undefined && {
              webhookSecret: stripeBilling.webhookSecret,
            }),
            ...(stripeBilling.apiKey !== undefined && { apiKey: stripeBilling.apiKey }),
            priceToTier: stripeBilling.priceToTier,
          }),
        ]
      : []),
  ],
  autoListen: false,
  // Subject-keys KMS when PLATFORM_KEK / SUBJECT_KEYS_DATABASE_URL /
  // KUMIKO_BLIND_INDEX_KEY are all set; otherwise plaintext with an explicit
  // reason (demo / local). Partial trio is a boot error.
  ...kmsWiring,
  staticDir: "./dist",
  seedsDir: "./seeds",
  extraContext: ({ registry, db }) => ({
    configResolver,
    _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    templateResolver: createTemplateResolverApi(db),
    ...(stripeBilling !== null && { billingPrices: stripeBilling.prices }),
  }),
  // Tenant resolve/exists: show-pony-tenant-routing feature (#1374).
  anonymousAccess: ({ db }) => {
    bindSubdomainPageResolver({ db, baseDomain: BASE_DOMAIN });
    return {};
  },
  hostDispatch: ({ host, path }) => {
    const h = hostnameOf(host);
    if (h === BASE_DOMAIN || h === `www.${BASE_DOMAIN}`) {
      const dispatched = dispatchShowPonyApexStatic(path);
      if (dispatched !== null) return dispatched;
      return { kind: "html", file: "admin.html", injectSchema: true };
    }
    return { kind: "html", file: "index.html", injectSchema: false };
  },
  auth: {
    cookieDomain: BASE_DOMAIN,
    allowedOrigins: [APEX_ORIGIN],
    admin: {
      email: required("DEMO_ADMIN_EMAIL"),
      password: required("DEMO_ADMIN_PASSWORD"),
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
    async ({ db }) => {
      await seedLegalContent(db);
    },
    async ({ db }) => {
      await seedSysadmin(db, {
        email: required("DEMO_SYSADMIN_EMAIL"),
        password: required("DEMO_SYSADMIN_PASSWORD"),
      });
    },
  ],
  extraRoutes: (app, { db, registry, dispatchSystemWrite }) => {
    wireDemoModeRoutes(app, port);
    wireTermsRoutes(app, createTemplateResolverApi(db));
    if (stripeBilling !== null) {
      wireSubscriptionWebhookRoute(app, { db, registry, dispatchSystemWrite });
    }
    const isAssetName = (file: string) => /^[a-zA-Z0-9_-]+\.(png|webp|svg|jpe?g)$/.test(file);
    const serveFromDir = async (dir: string, file: string): Promise<Response | null> => {
      if (!isAssetName(file)) return null;
      const f = Bun.file(`./dist/${dir}/${file}`);
      return (await f.exists()) ? new Response(f) : null;
    };
    app.get("/heroes/:file", async (c) => {
      const r = await serveFromDir("heroes", c.req.param("file"));
      return r ?? c.notFound();
    });
  },
});

const fetch = withDemoReadOnlyFetch(handle.fetch);

if (typeof Bun !== "undefined") {
  handle.server = Bun.serve({ port, fetch, idleTimeout: 0 });

  let shuttingDown = false;
  const shutdown = async (_signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      await handle.stop();
    } catch (e) {
      console.error("[runProdApp] error during shutdown:", e);
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}
