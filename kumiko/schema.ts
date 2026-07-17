// ENTITY_METAS source for `kumiko schema generate/apply/validate`.
//
// Computes table metas from the SAME composeFeatures(APP_FEATURES) the runtime
// sees (bin/main.ts, bin/server.ts) — migrations and runtime can't drift. The
// schema CLI imports this file and reads ENTITY_METAS directly.

import { composeFeatures } from "@cosmicdrift/kumiko-server-runtime/compose-features";
import { collectTableMetas, type EntityTableMeta } from "@cosmicdrift/kumiko-framework/db";
import type { FeatureDefinition } from "@cosmicdrift/kumiko-framework/engine";
import { APP_FEATURES, HAS_AUTH } from "../src/run-config";

export const FEATURES: readonly FeatureDefinition[] = composeFeatures([...APP_FEATURES], {
  includeBundled: HAS_AUTH,
});

export const ENTITY_METAS: readonly EntityTableMeta[] = collectTableMetas(FEATURES);
