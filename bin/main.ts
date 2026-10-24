// Production entry. Env contract and the full var list: bin/env-schema.ts.
import {
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { createTemplateResolverApi } from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import { allAppFeatures } from "@cosmicdrift/kumiko-framework/config";
import { runProdApp } from "@cosmicdrift/kumiko-server-runtime";
import appConfig from "../kumiko.config";
import { DEFAULT_TIER, priceToTierFromEnv, TIER_NAMES } from "../src/features/show-pony/tier-map";
import { createShowPonyHostDispatch } from "../src/host-dispatch";
import { renderAllMarketingPages } from "../src/marketing/render-landing";
import { bindSubdomainPageResolver } from "../src/tenant-routing";
import { env, isDryRun } from "./env";
import { showPonyEnvSchema } from "./env-schema";
import {
  buildDemoModeOption,
  buildProdAuthOptions,
  buildProdSeeds,
  heroAssetRoute,
} from "./prod-options";
import { resolveSearchAdapter } from "./search-wiring";

// BASE_DOMAIN is required, so the placeholder only exists for the dry run's empty env.
const BASE_DOMAIN = env.BASE_DOMAIN ?? "dry-run.invalid";
const configResolver = createConfigResolver();
const priceToTier = priceToTierFromEnv(env);

// The dry run only prints the env inventory: no dist writes, no search wiring.
if (!isDryRun) await renderAllMarketingPages(`https://${BASE_DOMAIN}`);
const searchWiring = resolveSearchAdapter(isDryRun ? {} : env);

// After the first real KMS deploy run `bun kumiko ops backfill-pii` once.
await runProdApp({
  features: allAppFeatures(appConfig),
  envSchema: showPonyEnvSchema,
  pulumiPrefix: "showPony",
  kmsMode: { plaintextReason: "show-pony demo app, no subject-keys KMS provisioned" },
  ...(appConfig.validateBootOptions && { validateBootOptions: appConfig.validateBootOptions }),
  staticDir: "./dist",
  seedsDir: "./seeds",
  extraContext: ({ registry, db }) => {
    bindSubdomainPageResolver({ db, baseDomain: BASE_DOMAIN });
    return {
      configResolver,
      configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
      templateResolver: createTemplateResolverApi(db, registry),
      searchAdapter: searchWiring.adapter,
    };
  },
  // Opt-in only: the host-routing provider fills tenantResolver/tenantExists, but never enables anonymous access.
  anonymousAccess: {},
  hostDispatch: createShowPonyHostDispatch(BASE_DOMAIN),
  auth: buildProdAuthOptions({
    baseDomain: BASE_DOMAIN,
    adminEmail: env.DEMO_ADMIN_EMAIL,
    adminPassword: env.DEMO_ADMIN_PASSWORD,
  }),
  seeds: buildProdSeeds(searchWiring),
  demoMode: buildDemoModeOption(env, BASE_DOMAIN),
  ...(Object.keys(priceToTier).length > 0 && {
    billing: {
      stripe: { priceToTier },
      defaultTier: DEFAULT_TIER,
      tierNames: TIER_NAMES,
    },
  }),
  extraRoutes: [heroAssetRoute],
});
