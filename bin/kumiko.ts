#!/usr/bin/env bun

// Standalone kumiko schema CLI for the production bundle. The deploy migrate
// step runs `bun /app/kumiko.js schema apply`; kumiko-build discovers this
// file and bundles it to dist-server/kumiko.js.
//
// All schema-apply logic — migrations, idempotent greenfield infra tables, and
// projection rebuild after a schema change — lives in the framework's
// runSchemaCli. The feature set (for the rebuild's registry) is the same one
// the schema tooling uses, so we only delegate.

import { runSchemaCli } from "@cosmicdrift/kumiko-framework/schema-cli";
import { FEATURES } from "../kumiko/schema";

const [, , cmd, ...rest] = Bun.argv;
if (cmd !== "schema") {
  console.error(`Unknown command: ${cmd ?? "(none)"} — only "schema" is supported.`);
  process.exit(1);
}

const out = { log: (l: string) => console.log(l), err: (l: string) => console.error(l) };
process.exit(
  await runSchemaCli(rest, process.env["INIT_CWD"] ?? process.cwd(), out, {
    features: FEATURES,
    // show-pony provisions no Key Manager ciphertexts.
    kmsSlots: [],
  }),
);
