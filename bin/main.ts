// Production entry. Env contract and the full var list: bin/env-schema.ts.
import { createConfigResolver } from "@cosmicdrift/kumiko-bundled-features/config";
import { allAppFeatures } from "@cosmicdrift/kumiko-framework/config";
import { resolveObservabilityWiring } from "@cosmicdrift/kumiko-framework/observability";
import { createSearchAdapterFromEnv } from "@cosmicdrift/kumiko-framework/search/meilisearch";
import { runProdApp } from "@cosmicdrift/kumiko-server-runtime";
import appConfig from "../kumiko.config";
import {
  buildShowPonyBillingOption,
  SHOW_PONY_KMS_MODE,
} from "../src/features/show-pony/billing/billing-option";
import { priceToTierFromEnv } from "../src/features/show-pony/tier-map";
import { createShowPonyHostDispatch } from "../src/host-dispatch";
import { renderAllMarketingPages } from "../src/marketing/render-landing";
import { env, isDryRun } from "./env";
import { envSchema } from "./env-schema";
import { buildShowPonyExtraContext } from "./extra-context";
import {
  buildDemoModeOption,
  buildProdAuthOptions,
  buildProdSeeds,
  heroAssetRoute,
} from "./prod-options";
import { MEILI_INDEX_PREFIX } from "./search-wiring";

// BASE_DOMAIN is required, so the placeholder only exists for the dry run's empty env.
const BASE_DOMAIN = env.BASE_DOMAIN ?? "dry-run.invalid";
const configResolver = createConfigResolver();
const billing = buildShowPonyBillingOption(priceToTierFromEnv(env));

// The dry run only prints the env inventory: no dist writes, no search wiring.
if (!isDryRun) await renderAllMarketingPages(`https://${BASE_DOMAIN}`);
const searchAdapter = createSearchAdapterFromEnv(isDryRun ? {} : env, {
  indexPrefix: MEILI_INDEX_PREFIX,
});

// After the first real KMS deploy run `bun kumiko ops backfill-pii` once.
await runProdApp({
  features: allAppFeatures(appConfig),
  envSchema,
  pulumiPrefix: "showPony",
  ...resolveObservabilityWiring(env.PROMETHEUS_METRICS_TOKEN),
  kmsMode: SHOW_PONY_KMS_MODE,
  ...(appConfig.validateBootOptions && { validateBootOptions: appConfig.validateBootOptions }),
  seedsDir: "./seeds",
  extraContext: buildShowPonyExtraContext({ configResolver, searchAdapter }),
  // Opt-in only: the host-routing provider fills tenantResolver/tenantExists, but never enables anonymous access.
  anonymousAccess: {},
  hostDispatch: createShowPonyHostDispatch(BASE_DOMAIN),
  auth: buildProdAuthOptions({
    baseDomain: BASE_DOMAIN,
    adminEmail: env.DEMO_ADMIN_EMAIL,
    adminPassword: env.DEMO_ADMIN_PASSWORD,
  }),
  seeds: buildProdSeeds(searchAdapter),
  demoMode: buildDemoModeOption(env, BASE_DOMAIN),
  ...(billing && { billing }),
  extraRoutes: [heroAssetRoute],
});
