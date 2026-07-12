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

import { seedAdmin } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/seeding";
import {
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { createTextContentApi } from "@cosmicdrift/kumiko-bundled-features/text-content";
import { runDevApp } from "@cosmicdrift/kumiko-dev-server";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import { wireDemoModeRoutes } from "../src/demo-mode-routes";
import { wireTermsRoutes } from "../src/legal-terms";
import { dispatchShowPonyApexStaticDev } from "../src/marketing/locale-routes";
import { renderAllMarketingPages } from "../src/marketing/render-landing";
import { APP_FEATURES } from "../src/run-config";
import { createShowPonyTenantResolver, hostnameOf } from "../src/tenant-routing";
import { seedLegalContent } from "./seed-legal-content";

const BASE_DOMAIN = process.env.BASE_DOMAIN ?? "show-pony.localhost";
const port = Number.parseInt(process.env.PORT ?? "4180", 10);
const DEV_ORIGIN = `http://${BASE_DOMAIN}:${port}`;
const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

await renderAllMarketingPages(DEV_ORIGIN);

const isAssetName = (file: string) => /^[a-zA-Z0-9_-]+\.(png|webp|svg|jpe?g)$/.test(file);
async function serveFromDir(dir: string, file: string): Promise<Response | null> {
  if (!isAssetName(file)) return null;
  const f = Bun.file(`./public/${dir}/${file}`);
  return (await f.exists()) ? new Response(f) : null;
}

await runDevApp({
  features: APP_FEATURES,
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
  anonymousAccess: ({ db }) => createShowPonyTenantResolver({ db, baseDomain: BASE_DOMAIN }),
  extraContext: ({ registry, db }) => ({
    configResolver,
    _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    textContent: createTextContentApi(db),
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
    async (stack) => {
      await seedLegalContent(stack.db);
    },
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
  extraRoutes: (app, { db }) => {
    wireDemoModeRoutes(app);
    wireTermsRoutes(app, createTextContentApi(db));
    app.get("/screenshots/:file", async (c) => {
      const r = await serveFromDir("screenshots", c.req.param("file"));
      return r ?? c.notFound();
    });
    app.get("/logos/:file", async (c) => {
      const r = await serveFromDir("logos", c.req.param("file"));
      return r ?? c.notFound();
    });
  },
});
