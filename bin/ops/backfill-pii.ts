// One-time PII event backfill (fw#799) — re-encrypts pre-KMS plaintext PII
// in kumiko_events and rebuilds the projections (ciphertext + blind index).
// Runbook: kumiko-platform/docs/runbooks/pii-event-backfill.md
//
// Required for RSVP guest data (show-pony#130): the switch from
// `personal: false` to `personal: "self"` on rsvp.name/email/note only
// encrypts NEW writes. RSVP events appended before that switch are still
// plaintext in the event log, and a later crypto-shredding:write:forget-
// subject for one of them would report success without erasing anything —
// there was never a subject key to erase. This script closes that gap by
// re-encrypting the historical events under each row's own subject
// (personal: "self" — the RSVP row id) and rebuilding the projection.
//
//   DATABASE_URL=... SUBJECT_KEYS_DATABASE_URL=... PLATFORM_KEK=... \
//   KUMIKO_BLIND_INDEX_KEY=... bun bin/ops/backfill-pii.ts --dry-run
//
// Flags: --dry-run (scan+count only), --skip-rebuild (backfill only).

import {
  buildPgKmsOptions,
  configureBlindIndexKey,
  configurePiiSubjectKms,
  createPgKmsAdapter,
} from "@cosmicdrift/kumiko-framework/crypto";
import { createDbConnection } from "@cosmicdrift/kumiko-framework/db";
import { createRegistry } from "@cosmicdrift/kumiko-framework/engine";
import { backfillEventPiiEncryption } from "@cosmicdrift/kumiko-framework/event-store";
import {
  listProjectionsWithState,
  rebuildProjection,
} from "@cosmicdrift/kumiko-framework/pipeline";
import { ensureTemporalPolyfill } from "@cosmicdrift/kumiko-framework/time";
import { composeFeatures } from "@cosmicdrift/kumiko-server-runtime/compose-features";
import { buildAppFeatures, HAS_AUTH, resolveBaseDomainFromEnv } from "../../src/run-config";

await ensureTemporalPolyfill();

const dryRun = process.argv.includes("--dry-run");
const skipRebuild = process.argv.includes("--skip-rebuild");

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[backfill-pii] missing env ${name}`);
  return value;
}

const databaseUrl = requiredEnv("DATABASE_URL");
// buildPgKmsOptions (not a hand-rolled { databaseUrl, platformKek }) so a KEK
// rotation in flight (PLATFORM_KEK_VERSION/_PREVIOUS/_PREVIOUS_VERSION) is
// honored — otherwise rows backfilled here get tagged kekVersion 1 and can
// become undecryptable once the live app rotates past it.
const kms = createPgKmsAdapter(
  buildPgKmsOptions({
    ...process.env,
    PLATFORM_KEK: requiredEnv("PLATFORM_KEK"),
    SUBJECT_KEYS_DATABASE_URL: requiredEnv("SUBJECT_KEYS_DATABASE_URL"),
  }),
);
configurePiiSubjectKms(kms);
configureBlindIndexKey(requiredEnv("KUMIKO_BLIND_INDEX_KEY"));

// Same feature set as bin/main.ts boots with — the registry drives which
// entities/events carry PII.
const appFeatures = buildAppFeatures({ baseDomain: resolveBaseDomainFromEnv() });
const registry = createRegistry(composeFeatures([...appFeatures], { includeBundled: HAS_AUTH }));

const { db, close } = createDbConnection(databaseUrl, { maxConnections: 4 });
let failed = false;
try {
  const result = await backfillEventPiiEncryption(db, registry, { dryRun });
  // biome-ignore lint/suspicious/noConsole: ops-script stdout is the report
  console.log(`[backfill-pii]${dryRun ? " DRY-RUN" : ""}`, JSON.stringify(result, null, 2));
  if (result.failures.length > 0) {
    // biome-ignore lint/suspicious/noConsole: ops-script stdout is the report
    console.error(
      `[backfill-pii] ${result.failures.length} events failed — nothing skipped silently, rerun after inspecting.`,
    );
    failed = true;
  }

  if (!failed && !dryRun && !skipRebuild) {
    const rebuildFailures: string[] = [];
    for (const p of await listProjectionsWithState(db, registry, { includeImplicit: true })) {
      try {
        const r = await rebuildProjection(p.name, { db, registry });
        // biome-ignore lint/suspicious/noConsole: ops-script stdout is the report
        console.log(
          `[backfill-pii] rebuilt ${p.name}:`,
          JSON.stringify(r, (_k, v) => (typeof v === "bigint" ? String(v) : v)),
        );
      } catch (error) {
        // One broken projection must not block the remaining rebuilds —
        // collect and fail loud at the end.
        rebuildFailures.push(
          `${p.name}: ${error instanceof Error ? error.message : String(error)}`,
        );
        // biome-ignore lint/suspicious/noConsole: ops-script stdout is the report
        console.error(`[backfill-pii] REBUILD FAILED ${p.name}`);
      }
    }
    if (rebuildFailures.length > 0) {
      // biome-ignore lint/suspicious/noConsole: ops-script stdout is the report
      console.error(
        `[backfill-pii] ${rebuildFailures.length} rebuild(s) failed:\n${rebuildFailures.join("\n")}`,
      );
      process.exitCode = 1;
    }
  }
} finally {
  // Independent try/finally per pool: a throw from one close() must not skip
  // the other, or bun keeps the process alive on the still-open pool.
  try {
    await close();
  } finally {
    await kms.close();
  }
}
if (failed) process.exitCode = 1;
