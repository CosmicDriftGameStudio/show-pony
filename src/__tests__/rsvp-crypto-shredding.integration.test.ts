// Art. 17 proof for RSVP guest PII (show-pony#91).
//
// An RSVP is an anonymous business row (no login) — user-data-rights does not
// cover it. Erasure is crypto-shredding:write:forget-subject with the RSVP id
// as subject. Without this test, "Art. 17 ok" is a claim about annotations;
// with it, it's a claim about behaviour.

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  configValuesTable,
  createConfigAccessorFactory,
  createConfigFeature,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { createCryptoShreddingFeature } from "@cosmicdrift/kumiko-bundled-features/crypto-shredding";
import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { mailTransportInMemoryFeature } from "@cosmicdrift/kumiko-bundled-features/mail-transport-inmemory";
import { createManagedPagesFeature } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { tenantEntity } from "@cosmicdrift/kumiko-bundled-features/tenant";
import { seedTenant } from "@cosmicdrift/kumiko-bundled-features/tenant/seeding";
import { asRawClient } from "@cosmicdrift/kumiko-framework/bun-db";
import {
  configureBlindIndexKey,
  configurePiiSubjectKms,
  InMemoryKmsAdapter,
  isPiiCiphertext,
  PII_ERASED_SENTINEL,
} from "@cosmicdrift/kumiko-framework/crypto";
import type { SessionUser } from "@cosmicdrift/kumiko-framework/engine";
import {
  append,
  backfillEventPiiEncryption,
  createEventsTable,
} from "@cosmicdrift/kumiko-framework/event-store";
import {
  listProjectionsWithState,
  rebuildProjection,
} from "@cosmicdrift/kumiko-framework/pipeline";
import {
  setupTestStack,
  type TestStack,
  TestUsers,
  testTenantId,
  unsafeCreateEntityTable,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import {
  resetBlindIndexKeyForTests,
  resetPiiSubjectKmsForTests,
} from "@cosmicdrift/kumiko-framework/testing";
import { eventEntity, rsvpEntity, rsvpTable, showPonyFeature } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { createShowPonyAnonymousAccess } from "../tenant-routing";

const BIDX_KEY = Buffer.alloc(32, 9).toString("base64");
const BASE_DOMAIN = "show-pony.test";
const ACME = testTenantId(1);
// Empty until beforeAll seeds a real event — leftover UUID silently passes z.uuid() (show-pony#134/2).
let eventId = "";
const FORGET = "crypto-shredding:write:forget-subject";

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

const host: SessionUser = { ...TestUsers.admin, tenantId: ACME };
const dpo: SessionUser = {
  id: "dpo-1",
  tenantId: ACME,
  roles: ["DataProtectionOfficer"],
};

let stack: TestStack;

type RsvpRow = { id: string; name: string; email?: string | null; note?: string | null };

function submit(payload: Record<string, unknown>) {
  return stack.http.raw(
    "POST",
    "/api/write",
    { type: "showpony:write:rsvp:submit", payload },
    { Host: `acme.${BASE_DOMAIN}` },
  );
}

async function listRows(): Promise<RsvpRow[]> {
  const res = await stack.http.query("showpony:query:rsvp:list", {}, host);
  const body = (await res.json()) as { data: { rows: RsvpRow[] } };
  return body.data.rows;
}

async function submitGuest(name: string, email: string, note: string): Promise<string> {
  const res = await submit({
    eventId,
    name,
    email,
    note,
    status: "yes",
    plusN: 0,
  });
  expect(res.status).toBe(200);
  const row = (await listRows()).find((r) => r.name === name);
  expect(row).toBeDefined();
  return row!.id;
}

beforeAll(async () => {
  stack = await setupTestStack({
    features: [
      createConfigFeature(),
      createManagedPagesFeature({ resolveApexTenant: async () => null }),
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      createCryptoShreddingFeature(),
      showPonyFeature,
    ],
    anonymousAccess: ({ db }) => createShowPonyAnonymousAccess({ db, baseDomain: BASE_DOMAIN }),
    extraContext: ({ registry }) => ({
      configResolver,
      _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    }),
  });
  await unsafeCreateEntityTable(stack.db, tenantEntity);
  await unsafeCreateEntityTable(stack.db, eventEntity, "event");
  await unsafeCreateEntityTable(stack.db, rsvpEntity, "rsvp");
  await unsafePushTables(stack.db, {
    configValuesTable,
    tier_assignments: tierAssignmentTable,
  });
  await createEventsTable(stack.db);
  await seedTenant(stack.db, { id: ACME, key: "acme", name: "Acme" });

  const created = await stack.http.writeOk<{ id: string }>(
    "showpony:write:event:create",
    {
      title: "Crypto shredding test event",
      slug: "crypto-shred-test",
      startsAt: "2026-09-12T19:00:00.000Z",
      guestLimit: 50,
    },
    host,
  );
  eventId = created.id;
});

afterAll(async () => {
  await stack?.cleanup();
});

beforeEach(async () => {
  configurePiiSubjectKms(new InMemoryKmsAdapter());
  configureBlindIndexKey(BIDX_KEY);
  await asRawClient(stack.db).unsafe(`DELETE FROM "${rsvpTable.tableName}"`);
});

afterEach(() => {
  resetPiiSubjectKmsForTests();
  resetBlindIndexKeyForTests();
});

describe("crypto-shredding:forget-subject — operator erasure for RSVP guests", () => {
  test("forget renders name/email unreadable and leaves other guests untouched", async () => {
    const targetId = await submitGuest("Tommy Pilot", "tommy@pilot.test", "Vegetarian meal");
    const bystanderId = await submitGuest("Peter Guest", "peter@pilot.test", "No allergies");

    const before = await listRows();
    expect(before.find((r) => r.id === targetId)?.name).toBe("Tommy Pilot");
    expect(before.find((r) => r.id === targetId)?.email).toBe("tommy@pilot.test");
    expect(before.find((r) => r.id === targetId)?.note).toBe("Vegetarian meal");

    await stack.http.writeOk(
      FORGET,
      {
        subject: { kind: "user", userId: targetId },
        reason: "Erasure request via host (test)",
      },
      dpo,
    );

    const after = await listRows();
    expect(after.find((r) => r.id === targetId)?.name).toBe(PII_ERASED_SENTINEL);
    expect(after.find((r) => r.id === targetId)?.email).toBe(PII_ERASED_SENTINEL);
    expect(after.find((r) => r.id === targetId)?.note).toBe(PII_ERASED_SENTINEL);
    expect(after.find((r) => r.id === bystanderId)?.name).toBe("Peter Guest");
    expect(after.find((r) => r.id === bystanderId)?.email).toBe("peter@pilot.test");
    expect(after.find((r) => r.id === bystanderId)?.note).toBe("No allergies");
  });

  test("ciphertext column remains after forget — the key is erased, not the row", async () => {
    const id = await submitGuest("Klara Keep", "klara@pilot.test", "Late arrival");

    await stack.http.writeOk(
      FORGET,
      {
        subject: { kind: "user", userId: id },
        reason: "Authority request (test)",
      },
      dpo,
    );

    const rows = await asRawClient(stack.db).unsafe<Record<string, unknown>>(
      `SELECT name, email, note, status FROM "${rsvpTable.tableName}" WHERE id = $1`,
      [id],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.["status"]).toBe("yes");
    expect(isPiiCiphertext(rows[0]?.["name"])).toBe(true);
    expect(isPiiCiphertext(rows[0]?.["email"])).toBe(true);
    expect(isPiiCiphertext(rows[0]?.["note"])).toBe(true);
  });

  test("a tenant Admin without DPO role cannot shred an RSVP", async () => {
    const id = await submitGuest("Keep Me", "keep@pilot.test", "Do not erase");

    const err = await stack.http.writeErr(
      FORGET,
      {
        subject: { kind: "user", userId: id },
        reason: "unauthorized attempt (test)",
      },
      host,
    );
    expect(err.httpStatus).toBe(403);

    const still = await listRows();
    expect(still.find((r) => r.id === id)?.name).toBe("Keep Me");
  });
});

describe("PII backfill for pre-encryption RSVP events (show-pony#130/1)", () => {
  // The personal:false -> "self" switch on rsvp.name/email/note (show-pony#130)
  // only encrypts NEW writes. Simulates an RSVP submitted before that switch:
  // its rsvp.created event carries plaintext name/email/note directly in
  // kumiko_events, with no subject key ever minted. Without a backfill,
  // forget-subject on it would report success without erasing anything —
  // there is no key to erase. bin/ops/backfill-pii.ts runs
  // backfillEventPiiEncryption to re-encrypt such events after the fact.
  test("forget-subject erases a legacy plaintext RSVP after the PII backfill runs", async () => {
    // Isolate the rsvp event stream from earlier tests in this file: a full
    // projection rebuild below replays every rsvp.created event since
    // genesis, and those events were encrypted under a KMS instance that no
    // longer exists (beforeEach mints a fresh one per test).
    await asRawClient(stack.db).unsafe(`DELETE FROM "kumiko_events" WHERE aggregate_type = $1`, [
      "rsvp",
    ]);

    const legacyId = crypto.randomUUID();
    await append(stack.db, {
      aggregateId: legacyId,
      aggregateType: "rsvp",
      tenantId: ACME,
      expectedVersion: 0,
      type: "rsvp.created",
      payload: {
        eventId,
        name: "Legacy Guest",
        email: "legacy@old.test",
        status: "yes",
        plusN: 0,
        note: "Pre-KMS plaintext note",
      },
      metadata: { userId: "system" },
    });

    const rsvpProjections = (
      await listProjectionsWithState(stack.db, stack.registry, { includeImplicit: true })
    ).filter((p) => p.sources.includes("rsvp"));

    // Materialize the pre-fix state first: plaintext event -> plaintext row.
    // This is what makes the test discriminate the real bug (forget-subject
    // leaves a legacy row readable) rather than just "did rebuild run".
    for (const projection of rsvpProjections) {
      await rebuildProjection(projection.name, { db: stack.db, registry: stack.registry });
    }
    const legacyRawBefore = await asRawClient(stack.db).unsafe<Record<string, unknown>>(
      `SELECT name FROM "${rsvpTable.tableName}" WHERE id = $1`,
      [legacyId],
    );
    expect(isPiiCiphertext(legacyRawBefore[0]?.["name"])).toBe(false);
    const preBackfill = await listRows();
    expect(preBackfill.find((r) => r.id === legacyId)?.name).toBe("Legacy Guest");

    const backfillResult = await backfillEventPiiEncryption(stack.db, stack.registry);
    expect(backfillResult.failures).toEqual([]);
    expect(backfillResult.encryptedFields).toBe(3);

    for (const projection of rsvpProjections) {
      await rebuildProjection(projection.name, { db: stack.db, registry: stack.registry });
    }

    const decrypted = await listRows();
    expect(decrypted.find((r) => r.id === legacyId)?.name).toBe("Legacy Guest");
    expect(decrypted.find((r) => r.id === legacyId)?.email).toBe("legacy@old.test");

    await stack.http.writeOk(
      FORGET,
      {
        subject: { kind: "user", userId: legacyId },
        reason: "Erasure request on backfilled legacy row (test)",
      },
      dpo,
    );

    const erased = await listRows();
    expect(erased.find((r) => r.id === legacyId)?.name).toBe(PII_ERASED_SENTINEL);
    expect(erased.find((r) => r.id === legacyId)?.email).toBe(PII_ERASED_SENTINEL);
    expect(erased.find((r) => r.id === legacyId)?.note).toBe(PII_ERASED_SENTINEL);
  });
});
