// kumiko-managed
// kumiko-managed: local auth-mode app: schema and boot validation need the bundled auth features composeFeatures adds
// Input of the schema tooling (kumiko-schema generate|apply|validate and the
// boot step of kumiko check), derived from kumiko.config.ts. Edit the feature
// lists there.

import { allAppFeatures } from "@cosmicdrift/kumiko-framework/config";
import { collectTableMetas, type EntityTableMeta } from "@cosmicdrift/kumiko-framework/db";
import type { FeatureDefinition } from "@cosmicdrift/kumiko-framework/engine";
import { composeFeatures } from "@cosmicdrift/kumiko-server-runtime/compose-features";
import appConfig from "../kumiko.config";
import { HAS_AUTH } from "../src/run-config";

export const FEATURES: readonly FeatureDefinition[] = composeFeatures(allAppFeatures(appConfig), {
  includeBundled: HAS_AUTH,
});

export const ENTITY_METAS: readonly EntityTableMeta[] = collectTableMetas(FEATURES);

export const VALIDATE_BOOT_OPTIONS = appConfig.validateBootOptions;

// Decides whether `generate` emits row-level-security policies and `apply` runs as a policy-enforced connection.
export const ROW_LEVEL_SECURITY = appConfig.rowLevelSecurity;
