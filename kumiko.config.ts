// Feature list for `kumiko agent lint` and `kumiko-guard-agent-manifest`.
//
// Reuses kumiko/schema.ts's FEATURES so the linted list is the same
// composeFeatures(APP_FEATURES) the runtime and the migration generator see —
// a config with its own composition could go green on a list the app never
// mounts.

import { FEATURES } from "./kumiko/schema";

export default { features: FEATURES };
