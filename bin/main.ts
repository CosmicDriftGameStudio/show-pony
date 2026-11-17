// Production entry. Env contract and the full var list: bin/env-schema.ts.
import { createConfigResolver } from "@cosmicdrift/kumiko-bundled-features/config";
import { allAppFeatures } from "@cosmicdrift/kumiko-framework/config";
import { resolveObservabilityWiring } from "@cosmicdrift/kumiko-framework/observability";
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
import { showPonyEnvSchema } from "./env-schema";
import { buildShowPonyExtraContext } from "./extra-context";
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
const billing = buildShowPonyBillingOption(priceToTierFromEnv(env));

// The dry run only prints the env inventory: no dist writes, no search wiring.
if (!isDryRun) await renderAllMarketingPages(`https://${BASE_DOMAIN}`);
const searchWiring = resolveSearchAdapter(isDryRun ? {} : env);

// After the first real KMS deploy run `bun kumiko ops backfill-pii` once.
await runProdApp({
  features: allAppFeatures(appConfig),
  envSchema: showPonyEnvSchema,
  pulumiPrefix: "showPony",
  ...resolveObservabilityWiring(env.PROMETHEUS_METRICS_TOKEN),
  kmsMode: SHOW_PONY_KMS_MODE,
  ...(appConfig.validateBootOptions && { validateBootOptions: appConfig.validateBootOptions }),
  staticDir: "./dist",
  seedsDir: "./seeds",
  extraContext: buildShowPonyExtraContext({
    baseDomain: BASE_DOMAIN,
    configResolver,
    searchAdapter: searchWiring.adapter,
  }),
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
  ...(billing && { billing }),
  extraRoutes: [heroAssetRoute],
});
