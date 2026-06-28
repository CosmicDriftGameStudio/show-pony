// Production bootstrap for show-pony (Docker / any container host).
//
// Same shape as bin/server.ts (dev) but for production: runProdApp, https
// origins, env-driven admin + base domain.
//
// Required env: DATABASE_URL, REDIS_URL, JWT_SECRET, BASE_DOMAIN, ADMIN_EMAIL,
//   ADMIN_PASSWORD. Optional: PORT (default 3000), BUILD_VERSION.
//   BASE_DOMAIN is the host's surface, e.g. show-pony.kumiko.rocks — guest
//   pages live on <key>.<BASE_DOMAIN>.

import {
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { runProdApp } from "@cosmicdrift/kumiko-dev-server";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import { APP_FEATURES } from "../src/run-config";
import { createShowPonyTenantResolver, hostnameOf } from "../src/tenant-routing";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`show-pony: missing required env var ${name}`);
  return value;
}

const BASE_DOMAIN = required("BASE_DOMAIN");
const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;

// Same mail-provider override as dev — the sample uses the in-memory transport.
// A real deploy swaps in mail-transport-smtp and points this at its name.
const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

await runProdApp({
  features: APP_FEATURES,
  staticDir: "./dist",
  // Demo content for the public page (runs once per filename, idempotent).
  seedsDir: "./seeds",
  extraContext: ({ registry }) => ({
    configResolver,
    _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
  }),
  // Multi-tenant anonymous access — no defaultTenantId; every request resolves
  // to a tenant by subdomain (or gets 400 tenant_required).
  anonymousAccess: ({ db }) => createShowPonyTenantResolver({ db, baseDomain: BASE_DOMAIN }),
  // Apex → host dashboard (schema-injected), every subdomain → public page.
  // `file` is resolved relative to staticDir ("./dist") — no ./dist/ prefix.
  hostDispatch: ({ host }) => {
    const h = hostnameOf(host);
    if (h === BASE_DOMAIN || h === `www.${BASE_DOMAIN}`) {
      return { kind: "html", file: "admin.html", injectSchema: true };
    }
    return { kind: "html", file: "index.html", injectSchema: false };
  },
  auth: {
    cookieDomain: BASE_DOMAIN,
    allowedOrigins: [`https://${BASE_DOMAIN}`],
    admin: {
      email: required("ADMIN_EMAIL"),
      password: required("ADMIN_PASSWORD"),
      displayName: "Show-Pony Host",
      memberships: [
        {
          tenantId: DEMO_TENANT_ID,
          tenantKey: "demo",
          tenantName: "Demo Host",
          roles: ["Admin", "TenantAdmin"],
        },
      ],
    },
  },
  extraRoutes: (app) => {
    app.get("/api/version", (c) => c.json({ version: process.env.BUILD_VERSION ?? "dev" }));
  },
});
