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

import { createInMemoryTransport } from "@cosmicdrift/kumiko-bundled-features/channel-email";
import { createConfigResolver } from "@cosmicdrift/kumiko-bundled-features/config";
import { legalContentSeed } from "@cosmicdrift/kumiko-bundled-features/legal-pages";
import { runDevApp } from "@cosmicdrift/kumiko-dev-server";
import { createE2eSeedRoutes } from "@cosmicdrift/kumiko-dev-server/testing";
import { createMeilisearchAdapter } from "@cosmicdrift/kumiko-framework/search/meilisearch";
import { isE2eSeedingEnabled } from "@cosmicdrift/kumiko-testing/e2e/seed-route";
import appConfig from "../kumiko.config";
import {
  buildShowPonyBillingOption,
  SHOW_PONY_KMS_MODE,
} from "../src/features/show-pony/billing/billing-option";
import { priceToTierFromEnv } from "../src/features/show-pony/tier-map";
import legalContent from "../src/generated/legal-content.json";
import { createShowPonyDevHostDispatch } from "../src/host-dispatch";
import { renderAllMarketingPages } from "../src/marketing/render-landing";
import { buildAppFeatures, resolveBaseDomainFromEnv } from "../src/run-config";
import { ACME_TENANT, DEMO_TENANT, seedSysadmin } from "./demo-tenants";
import { createE2eBillingStubFeature, e2eBillingExtraSeeders } from "./e2e-billing-stub";
import { buildShowPonyExtraContext } from "./extra-context";
import { buildDemoModeOption, heroAssetRoute } from "./prod-options";
import { rebuildAllTenantSearchIndexes } from "./search-wiring";

const BASE_DOMAIN = resolveBaseDomainFromEnv(process.env);
const port = Number.parseInt(process.env["PORT"] ?? "4180", 10);
const DEV_ORIGIN = `http://${BASE_DOMAIN}:${port}`;

const configResolver = createConfigResolver();
const emailTransport = createInMemoryTransport();

await renderAllMarketingPages(DEV_ORIGIN);

const billing = isE2eSeedingEnabled()
  ? undefined
  : buildShowPonyBillingOption(priceToTierFromEnv(process.env));

const searchAdapter = createMeilisearchAdapter({
  url: process.env["MEILI_URL"] ?? "http://localhost:17700",
  apiKey: process.env["MEILI_MASTER_KEY"] ?? "kumiko-dev-key",
  // The dev Meilisearch on 17700 is shared with other apps using the default
  // kumiko_ prefix; the boot rebuild drops every index under this prefix.
  indexPrefix: "showpony_dev_",
});

await runDevApp({
  kmsMode: SHOW_PONY_KMS_MODE,
  demoMode: buildDemoModeOption({ DEMO_READ_ONLY: process.env["DEMO_READ_ONLY"] }, BASE_DOMAIN),
  ...(billing && { billing }),
  features: [
    ...buildAppFeatures({ baseDomain: BASE_DOMAIN, appBaseUrl: DEV_ORIGIN, emailTransport }),
    // E2E screenshot runs stub Stripe out (no real Stripe network access) —
    // bin/main.ts never imports this stub, so prod always gets the real plugin.
    ...(isE2eSeedingEnabled() ? [createE2eBillingStubFeature()] : []),
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
  extraContext: buildShowPonyExtraContext({ configResolver, searchAdapter }),
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
        await rebuildAllTenantSearchIndexes(stack.db, stack.registry, searchAdapter);
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
    // DataProtectionOfficer is the only role allowed to run crypto-shredding forget-subject.
    ...(isE2eSeedingEnabled()
      ? createE2eSeedRoutes({
          extraRoles: ["Admin", "DataProtectionOfficer"],
          extraSeeders: e2eBillingExtraSeeders,
          mailOutbox: emailTransport,
        })
      : []),
    heroAssetRoute,
  ],
});
