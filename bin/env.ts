// Typed prod env. Parsed once at module load: a missing or invalid var aborts the boot with
// an aggregated KumikoBootError before runProdApp reaches the database.

import { parseEnv, parseEnvDryRun } from "@cosmicdrift/kumiko-framework/env";
import { isDryRunEnvActive } from "@cosmicdrift/kumiko-framework/env/dry-run";
import { productionKmsMode } from "@cosmicdrift/kumiko-server-runtime";
import appConfig from "../kumiko.config";
import { envSchema, type ShowPonyEnv } from "./env-schema";

export const isDryRun = isDryRunEnvActive(process.env);

// The mode `schema apply` also uses in production; undefined outside production.
export const productionKms = productionKmsMode(appConfig.kmsMode, process.env);

// The dry run prints the env inventory on an empty env, so its result is honestly partial.
export const env: Partial<ShowPonyEnv> = isDryRun
  ? parseEnvDryRun(envSchema.schema, process.env)
  : parseEnv(envSchema.schema, process.env, {
      sources: envSchema.sources,
      pulumiPrefix: "showPony",
    });
