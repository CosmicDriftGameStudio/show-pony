// Local dev-server für show-pony.
//
// Multi-Tenant-Start: ein Demo-Host-Tenant (key "demo") + Admin-Login.
// Der Host verwaltet Events auf dem Apex; die public RSVP-Page eines
// Hosts liegt auf seiner Subdomain — der anonyme Write landet via
// tenantResolver (Host-Header) deterministisch beim richtigen Tenant:
//
//   show-pony.localhost:4180        → Apex: Admin-UI + Auth
//   demo.show-pony.localhost:4180   → public RSVP-Surface des Demo-Hosts
//
// *.localhost resolved im Browser automatisch zu 127.0.0.1, kein
// hosts-Edit nötig. Start via `bun dev`; braucht Postgres + Redis.
//
//   admin@show-pony.local / changeme  — Host auf dem Demo-Tenant

import { runDevApp } from "@cosmicdrift/kumiko-dev-server";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import { APP_FEATURES } from "../src/run-config";
import { createShowPonyTenantResolver, hostnameOf } from "../src/tenant-routing";

const BASE_DOMAIN = process.env.BASE_DOMAIN ?? "show-pony.localhost";
const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;
const port = Number.parseInt(process.env.PORT ?? "4180", 10);

await runDevApp({
  features: APP_FEATURES,
  port,
  // Zwei Bundles, server-seitig geroutet: Apex → Host-Dashboard (mit
  // Schema-Inject für die Screens), jede Subdomain → public Event-Page.
  clientEntries: [
    { name: "admin", sourceFile: "./src/client.tsx", htmlPath: "./public/index.html" },
    { name: "public", sourceFile: "./src/client-public.tsx", htmlPath: "./public/public.html" },
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
});
