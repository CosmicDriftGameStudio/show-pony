// ENTITY_METAS source for `kumiko schema generate/apply/validate`.
//
// Computes table metas from the SAME composeFeatures(buildAppFeatures(...))
// the runtime sees (bin/main.ts, bin/server.ts) — migrations and runtime
// can't drift. The schema CLI imports this file and reads ENTITY_METAS
// directly.

import { composeFeatures } from "@cosmicdrift/kumiko-server-runtime/compose-features";
import { collectTableMetas, type EntityTableMeta } from "@cosmicdrift/kumiko-framework/db";
import type { FeatureDefinition } from "@cosmicdrift/kumiko-framework/engine";
import { buildAppFeatures, HAS_AUTH, resolveBaseDomainFromEnv } from "../src/run-config";

const appFeatures = buildAppFeatures({ baseDomain: resolveBaseDomainFromEnv() });

export const FEATURES: readonly FeatureDefinition[] = composeFeatures([...appFeatures], {
  includeBundled: HAS_AUTH,
});

export const ENTITY_METAS: readonly EntityTableMeta[] = collectTableMetas(FEATURES);
