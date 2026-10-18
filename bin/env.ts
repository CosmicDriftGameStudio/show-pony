// Typed prod env. Parsed once at module load: a missing or invalid var aborts the boot with
// an aggregated KumikoBootError before runProdApp reaches the database.

import { parseEnv, parseEnvDryRun } from "@cosmicdrift/kumiko-framework/env";
import { type ShowPonyEnv, showPonyEnvSchema } from "./env-schema";

// Must mirror runProdApp's parseRunMode (not exported by the framework): a value the app
// treats as dry run but the framework does not would boot for real on a partial env.
const FRAMEWORK_RUN_MODES = ["1", "true", "human", "json", "pulumi", "k8s", "boot"] as const;

export const isDryRun = FRAMEWORK_RUN_MODES.some(
  (mode) => mode === process.env["KUMIKO_DRY_RUN_ENV"]?.toLowerCase(),
);

// The dry run prints the env inventory on an empty env, so its result is honestly partial.
export const env: Partial<ShowPonyEnv> = isDryRun
  ? parseEnvDryRun(showPonyEnvSchema.schema, process.env)
  : parseEnv(showPonyEnvSchema.schema, process.env, {
      sources: showPonyEnvSchema.sources,
      pulumiPrefix: "showPony",
    });
