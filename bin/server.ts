// Local dev-server für show-pony.
//
// Schritt 1: Single-Host-Start — ein Demo-Host-Tenant + Admin-Login.
// Multi-Tenant-Subdomain-Routing + anonymer RSVP-Write kommen in einem
// späteren Schritt dazu (siehe docs). Start via `bun dev`; braucht
// Postgres + Redis (parent .env).
//
//   admin@show-pony.local / changeme  — Host auf dem Demo-Tenant

import { runDevApp } from "@cosmicdrift/kumiko-dev-server";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import { APP_FEATURES } from "../src/run-config";

const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;
const port = Number.parseInt(process.env["PORT"] ?? "4180", 10);

await runDevApp({
  features: APP_FEATURES,
  port,
  watchDirs: ["./src", "./bin"],
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
