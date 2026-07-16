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
import { createTextContentApi } from "@cosmicdrift/kumiko-bundled-features/text-content";
import { runDevApp } from "@cosmicdrift/kumiko-dev-server";
import { wireDemoModeRoutes } from "../src/demo-mode-routes";
import { wireSubscriptionWebhookRoute } from "../src/features/show-pony/billing/webhook-route";
import { wireTermsRoutes } from "../src/legal-terms";
import { dispatchShowPonyApexStaticDev } from "../src/marketing/locale-routes";
import { renderAllMarketingPages } from "../src/marketing/render-landing";
import { APP_FEATURES } from "../src/run-config";
import {
  bindSubdomainPageResolver,
  createShowPonyAnonymousAccess,
  hostnameOf,
} from "../src/tenant-routing";
import { ACME_TENANT, DEMO_TENANT, seedSysadmin } from "./demo-tenants";
import { seedLegalContent } from "./seed-legal-content";
import { buildStripeBillingConfig } from "./stripe-billing-env";

const BASE_DOMAIN = process.env.BASE_DOMAIN ?? "show-pony.localhost";
const port = Number.parseInt(process.env.PORT ?? "4180", 10);
const DEV_ORIGIN = `http://${BASE_DOMAIN}:${port}`;

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

await renderAllMarketingPages(DEV_ORIGIN);

const stripeBilling = buildStripeBillingConfig({
  STRIPE_API_KEY: process.env.STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER,
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
});

const isAssetName = (file: string) => /^[a-zA-Z0-9_-]+\.(png|webp|svg|jpe?g)$/.test(file);
async function serveFromDir(dir: string, file: string): Promise<Response | null> {
  if (!isAssetName(file)) return null;
  const f = Bun.file(`./public/${dir}/${file}`);
  return (await f.exists()) ? new Response(f) : null;
}

await runDevApp({
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
  anonymousAccess: ({ db }) => {
    bindSubdomainPageResolver({ db, baseDomain: BASE_DOMAIN });
    return createShowPonyAnonymousAccess({ db, baseDomain: BASE_DOMAIN });
  },
  extraContext: ({ registry, db }) => ({
    configResolver,
    _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    textContent: createTextContentApi(db),
    ...(stripeBilling !== null && { billingPrices: stripeBilling.prices }),
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
      await seedLegalContent(stack.db);
    },
    async ({ db }) => {
      await seedSysadmin(db, {
        email: "sysadmin@show-pony.local",
        password: "changeme",
      });
    },
  ],
  extraRoutes: (app, { db, registry, dispatchSystemWrite }) => {
    wireDemoModeRoutes(app, port);
    wireTermsRoutes(app, createTextContentApi(db));
    if (stripeBilling !== null) {
      wireSubscriptionWebhookRoute(app, { db, registry, dispatchSystemWrite });
    }
    app.get("/screenshots/:file", async (c) => {
      const r = await serveFromDir("screenshots", c.req.param("file"));
      return r ?? c.notFound();
    });
    app.get("/logos/:file", async (c) => {
      const r = await serveFromDir("logos", c.req.param("file"));
      return r ?? c.notFound();
    });
    app.get("/heroes/:file", async (c) => {
      const r = await serveFromDir("heroes", c.req.param("file"));
      return r ?? c.notFound();
    });
  },
});
