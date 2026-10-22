// Typed prod env. Parsed once at module load: a missing or invalid var aborts the boot with
// an aggregated KumikoBootError before runProdApp reaches the database.

import { parseEnv, parseEnvDryRun } from "@cosmicdrift/kumiko-framework/env";
import { isDryRunEnvActive } from "@cosmicdrift/kumiko-framework/env/dry-run";
import { type ShowPonyEnv, showPonyEnvSchema } from "./env-schema";

export const isDryRun = isDryRunEnvActive(process.env);

// The dry run prints the env inventory on an empty env, so its result is honestly partial.
export const env: Partial<ShowPonyEnv> = isDryRun
  ? parseEnvDryRun(showPonyEnvSchema.schema, process.env)
  : parseEnv(showPonyEnvSchema.schema, process.env, {
      sources: showPonyEnvSchema.sources,
      pulumiPrefix: "showPony",
    });
