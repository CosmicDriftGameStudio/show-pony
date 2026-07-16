#!/usr/bin/env bun

// Standalone kumiko schema CLI for the production bundle. The deploy migrate
// step runs `bun /app/kumiko.js schema apply`; kumiko-build discovers this
// file and bundles it to dist-server/kumiko.js.
//
// All schema-apply logic — migrations, idempotent greenfield infra tables, and
// projection rebuild after a schema change — lives in the framework's
// runSchemaCli. We only compose the app feature set (for the rebuild's
// registry) and delegate.

import { composeFeatures } from "@cosmicdrift/kumiko-dev-server/compose-features";
import { runSchemaCli } from "@cosmicdrift/kumiko-framework/schema-cli";
import { APP_FEATURES, HAS_AUTH } from "../src/run-config";

const [, , cmd, ...rest] = Bun.argv;
if (cmd !== "schema") {
  process.exit(1);
}

const features = composeFeatures([...APP_FEATURES], { includeBundled: HAS_AUTH });
const out = { log: (l: string) => console.log(l), err: (l: string) => console.error(l) };
process.exit(await runSchemaCli(rest, process.env.INIT_CWD ?? process.cwd(), out, { features }));
