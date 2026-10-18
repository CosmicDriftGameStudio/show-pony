// Prod boot options that would bury bin/main.ts.

import { legalContentSeed } from "@cosmicdrift/kumiko-bundled-features/legal-pages";
import type { ExtraRouteDefinition } from "@cosmicdrift/kumiko-framework/api";
import { createLogger } from "@cosmicdrift/kumiko-framework/logging";
import type { ProdSeedFn, RunProdAppOptions } from "@cosmicdrift/kumiko-server-runtime";
import legalContent from "../src/generated/legal-content.json";
import { ACME_TENANT, DEMO_TENANT, PLATFORM_TENANT } from "./demo-tenants";
import { rebuildAllTenantSearchIndexes, type SearchWiring } from "./search-wiring";

export function buildProdAuthOptions(args: {
  readonly baseDomain: string;
  readonly adminEmail: string | undefined;
  readonly adminPassword: string | undefined;
}): NonNullable<RunProdAppOptions["auth"]> {
  return {
    cookieDomain: args.baseDomain,
    allowedOrigins: [`https://${args.baseDomain}`],
    // demoAdminFromEnv seeds one tenant only; the host demo account belongs to two.
    ...(args.adminEmail !== undefined &&
      args.adminPassword !== undefined && {
        admin: {
          email: args.adminEmail,
          password: args.adminPassword,
          displayName: "Show-Pony Host",
          memberships: [DEMO_TENANT, ACME_TENANT].map((tenant) => ({
            tenantId: tenant.id,
            tenantKey: tenant.tenantKey,
            tenantName: tenant.name,
            roles: ["Admin", "TenantAdmin"],
          })),
        },
      }),
  };
}

const log = createLogger({ level: "info" }).child({ component: "show-pony-search" });

// Rebuilt on every boot: resetDbOnDeploy wipes the DB but not the Meilisearch volume, which
// would keep documents of vanished rows/tenants. A failing rebuild must not crash-loop the pod.
function searchIndexRebuildSeed(searchWiring: SearchWiring): ProdSeedFn {
  return async ({ db, registry }) => {
    try {
      const summary = await rebuildAllTenantSearchIndexes(db, registry, searchWiring);
      log.info("search index rebuilt", { ...summary });
    } catch (err) {
      log.warn("search index rebuild failed", { error: String(err) });
    }
  };
}

export function buildProdSeeds(
  searchWiring: SearchWiring,
): NonNullable<RunProdAppOptions["seeds"]> {
  return {
    sysadminFromEnv: {
      displayName: "Sysadmin",
      roles: ["User"],
      tenant: {
        id: PLATFORM_TENANT.id,
        key: PLATFORM_TENANT.tenantKey,
        name: PLATFORM_TENANT.name,
      },
    },
    run: [searchIndexRebuildSeed(searchWiring), legalContentSeed({ blocks: legalContent })],
  };
}

const HERO_ASSET_NAME = /^[a-zA-Z0-9_-]+\.(png|webp|svg|jpe?g)$/;

export const heroAssetRoute: ExtraRouteDefinition = {
  method: "GET",
  path: "/heroes/:file",
  entry: "anonymous",
  handler: async (c) => {
    const file = c.req.param("file");
    if (!file || !HERO_ASSET_NAME.test(file)) return c.notFound();
    const asset = Bun.file(`./dist/heroes/${file}`);
    return (await asset.exists()) ? new Response(asset) : c.notFound();
  },
};
