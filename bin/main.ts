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

import { seedAdmin } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/seeding";
import {
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { createSubscriptionStripeFeature } from "@cosmicdrift/kumiko-bundled-features/subscription-stripe";
import { createTextContentApi } from "@cosmicdrift/kumiko-bundled-features/text-content";
import { runProdApp } from "@cosmicdrift/kumiko-dev-server";
import { isDemoReadOnly, withDemoReadOnlyFetch } from "../src/demo-mode";
import { wireDemoModeRoutes } from "../src/demo-mode-routes";
import { wireSubscriptionWebhookRoute } from "../src/features/show-pony/billing/webhook-route";
import { wireTermsRoutes } from "../src/legal-terms";
import { dispatchShowPonyApexStatic } from "../src/marketing/locale-routes";
import { renderAllMarketingPages } from "../src/marketing/render-landing";
import { APP_FEATURES } from "../src/run-config";
import { createShowPonyAnonymousAccess, hostnameOf } from "../src/tenant-routing";
import { DEMO_TENANT, PLATFORM_TENANT } from "./demo-tenants";
import { seedLegalContent } from "./seed-legal-content";
import { buildStripeBillingConfig } from "./stripe-billing-env";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`show-pony: missing required env var ${name}`);
  return value;
}

const BASE_DOMAIN = required("BASE_DOMAIN");
const APEX_ORIGIN = `https://${BASE_DOMAIN}`;
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

await renderAllMarketingPages(APEX_ORIGIN);

const stripeBilling = buildStripeBillingConfig({
  STRIPE_API_KEY: process.env.STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER,
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
});

const handle = await runProdApp({
  features: [
    ...APP_FEATURES,
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
  allowPlaintextPii: "show-pony demo app, no KMS provisioned",
  staticDir: "./dist",
  seedsDir: "./seeds",
  extraContext: ({ registry, db }) => ({
    configResolver,
    _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    textContent: createTextContentApi(db),
    ...(stripeBilling !== null && { billingPrices: stripeBilling.prices }),
  }),
  anonymousAccess: ({ db }) => createShowPonyAnonymousAccess({ db, baseDomain: BASE_DOMAIN }),
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
      ],
    },
  },
  seeds: [
    async ({ db }) => {
      await seedLegalContent(db);
    },
    async ({ db }) => {
      await seedAdmin(db, {
        email: required("DEMO_SYSADMIN_EMAIL"),
        password: required("DEMO_SYSADMIN_PASSWORD"),
        displayName: "Sysadmin",
        globalRoles: ["SystemAdmin"],
        memberships: [
          {
            tenantId: PLATFORM_TENANT.id,
            tenantKey: PLATFORM_TENANT.tenantKey,
            tenantName: PLATFORM_TENANT.name,
            roles: ["User"],
          },
        ],
      });
    },
  ],
  extraRoutes: (app, { db, registry, dispatchSystemWrite }) => {
    wireDemoModeRoutes(app);
    wireTermsRoutes(app, createTextContentApi(db));
    if (stripeBilling !== null) {
      wireSubscriptionWebhookRoute(app, { db, registry, dispatchSystemWrite });
    }
  },
});

const fetch = withDemoReadOnlyFetch(handle.fetch);

if (isDemoReadOnly()) {
  console.log("[show-pony] DEMO_READ_ONLY enabled — /api/write blocked on this instance");
}

if (typeof Bun !== "undefined") {
  handle.server = Bun.serve({ port, fetch, idleTimeout: 0 });
  console.log(`[runProdApp] ready on http://0.0.0.0:${port}`);

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[runProdApp] ${signal} received — draining…`);
    try {
      await handle.stop();
      console.log("[runProdApp] graceful shutdown complete.");
    } catch (e) {
      console.error("[runProdApp] error during shutdown:", e);
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}
