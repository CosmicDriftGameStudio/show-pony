// Local dev server for show-pony.
//
// Multi-tenant startup: one demo host tenant (key "demo") + admin login.
// The host manages events on the apex; a host's public RSVP page lives
// on their subdomain — anonymous writes are routed deterministically to
// the correct tenant via tenantResolver (Host header):
//
//   show-pony.localhost:4180        → apex: admin UI + auth
//   demo.show-pony.localhost:4180   → public RSVP surface for the demo host
//
// *.localhost resolves to 127.0.0.1 in the browser automatically — no
// hosts file edit needed. Start with `bun dev`; requires Postgres + Redis.
//
//   admin@show-pony.local / changeme  — host account on the demo tenant

import { seedAdmin } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/seeding";
import {
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { runDevApp } from "@cosmicdrift/kumiko-dev-server";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import { wireDemoModeRoutes } from "../src/demo-mode-routes";
import { APP_FEATURES } from "../src/run-config";
import { createShowPonyTenantResolver, hostnameOf } from "../src/tenant-routing";

const BASE_DOMAIN = process.env.BASE_DOMAIN ?? "show-pony.localhost";
const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;
const port = Number.parseInt(process.env.PORT ?? "4180", 10);

// Default the mail provider app-wide to inmemory — otherwise guest confirmation
// emails fail with "no provider selected". Inbox via getInbox; prod swap = a real
// mail-transport-* with this override pointing to its name.
const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

await runDevApp({
  features: APP_FEATURES,
  port,
  // Two bundles, server-side routed: apex → host dashboard (with
  // schema injection for screens), each subdomain → public event page.
  clientEntries: [
    { name: "admin", sourceFile: "./src/client-admin.tsx", htmlPath: "./public/admin.html" },
    { name: "public", sourceFile: "./src/client-public.tsx", htmlPath: "./public/index.html" },
  ],
  htmlPath: "./public/index.html",
  hostDispatch: (req) => {
    const host = hostnameOf(req.headers.get("host") ?? "");
    if (host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`) {
      return { kind: "html", entryName: "admin", injectSchema: true };
    }
    return { kind: "html", entryName: "public", injectSchema: false };
  },
  watchDirs: ["./src", "./bin"],
  anonymousAccess: ({ db }) => createShowPonyTenantResolver({ db, baseDomain: BASE_DOMAIN }),
  extraContext: ({ registry }) => ({
    configResolver,
    _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
  }),
  auth: {
    admin: {
      email: "admin@show-pony.local",
      password: "changeme",
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
  seeds: [
    async ({ db }) => {
      await seedAdmin(db, {
        email: "sysadmin@show-pony.local",
        password: "changeme",
        displayName: "Sysadmin",
        globalRoles: ["SystemAdmin"],
        memberships: [
          {
            tenantId: DEMO_TENANT_ID,
            tenantKey: "demo",
            tenantName: "Demo Host",
            roles: ["User"],
          },
        ],
      });
    },
  ],
  extraRoutes: (app) => {
    wireDemoModeRoutes(app);
  },
});
