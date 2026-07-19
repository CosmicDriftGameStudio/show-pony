// The core proof: an anonymous RSVP write lands deterministically on the host
// tenant resolved from the subdomain (Host header) — never on the wrong one.
// That's the gap show-pony fills as a sample.
//
// We run the REAL production factory (createShowPonyAnonymousAccess, the
// same factory bin/main.ts/bin/server.ts wire) against real tenant rows —
// subdomain→key lookup AND the tenantExists guard against a forged X-Tenant
// header are both covered, not just the framework pipeline.

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  configValuesTable,
  createConfigAccessorFactory,
  createConfigFeature,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import {
  clearInbox,
  getInbox,
  mailTransportInMemoryFeature,
} from "@cosmicdrift/kumiko-bundled-features/mail-transport-inmemory";
import { createManagedPagesFeature } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { tenantEntity } from "@cosmicdrift/kumiko-bundled-features/tenant";
import { seedTenant } from "@cosmicdrift/kumiko-bundled-features/tenant/seeding";
import { asRawClient } from "@cosmicdrift/kumiko-framework/bun-db";
import { createEventsTable } from "@cosmicdrift/kumiko-framework/event-store";
import {
  setupTestStack,
  type TestStack,
  TestUsers,
  testTenantId,
  unsafeCreateEntityTable,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import { eventEntity, rsvpEntity, rsvpTable, showPonyFeature } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { createShowPonyAnonymousAccess } from "../tenant-routing";

// Default the mail provider app-wide to inmemory (otherwise createTransportForTenant
// throws "no provider selected") — the same appOverride as in bin/server.ts.
const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

const BASE_DOMAIN = "show-pony.test";
const ACME = testTenantId(1);
const GLOBEX = testTenantId(2);
const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";

let stack: TestStack;
const acmeHost = { ...TestUsers.admin, tenantId: ACME };
const globexHost = { ...TestUsers.admin, tenantId: GLOBEX, id: "globex-host-id" };

function submit(
  host: string,
  payload: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
) {
  return stack.http.raw(
    "POST",
    "/api/write",
    { type: "showpony:write:rsvp:submit", payload },
    { Host: host, ...extraHeaders },
  );
}

beforeAll(async () => {
  stack = await setupTestStack({
    features: [
      createConfigFeature(),
      createManagedPagesFeature({ resolveApexTenant: async () => null }),
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    // Exact boot wiring from bin/server.ts: the factory gets the stack db and
    // builds the real DB resolver.
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
  await seedTenant(stack.db, { id: GLOBEX, key: "globex", name: "Globex" });
});

afterAll(async () => stack?.cleanup());

beforeEach(async () => {
  await asRawClient(stack.db).unsafe(`DELETE FROM "${rsvpTable.tableName}"`);
  clearInbox(ACME);
  clearInbox(GLOBEX);
});

describe("anonymous multi-tenant RSVP write (real resolver)", () => {
  test("RSVP lands on the host tenant resolved from the subdomain", async () => {
    const acme = await submit("acme.show-pony.test", {
      eventId: EVENT_ID,
      name: "Alice",
      status: "yes",
      plusN: 1,
    });
    expect(acme.status).toBe(200);

    const globex = await submit("globex.show-pony.test", {
      eventId: EVENT_ID,
      name: "Bob",
      status: "maybe",
    });
    expect(globex.status).toBe(200);

    // Each host sees only its own guest through the tenant-scoped guest list.
    const acmeList = await stack.http.query("showpony:query:rsvp:list", {}, acmeHost);
    const acmeBody = (await acmeList.json()) as { data: { rows: Array<{ name: string }> } };
    expect(acmeBody.data.rows.map((r) => r.name)).toEqual(["Alice"]);

    const globexList = await stack.http.query("showpony:query:rsvp:list", {}, globexHost);
    const globexBody = (await globexList.json()) as { data: { rows: Array<{ name: string }> } };
    expect(globexBody.data.rows.map((r) => r.name)).toEqual(["Bob"]);
  });

  test("unknown subdomain → 400 tenant_required (resolver returned null)", async () => {
    const res = await submit("nope.show-pony.test", {
      eventId: EVENT_ID,
      name: "Ghost",
      status: "yes",
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("tenant_required");
  });

  test("forged X-Tenant header (unknown id) → 400 tenant_mismatch, resolver's tenant is NOT overridden", async () => {
    // resolverTrust: "authoritative" rejects ANY client tenant that
    // disagrees with the subdomain-resolved one before tenantExists ever
    // runs — the mismatch check fires first, so this is now tenant_mismatch
    // rather than the old tenant_not_found (which only proved the *unknown*
    // id was rejected, never that a REAL other tenant's id would be too).
    const res = await submit(
      "acme.show-pony.test",
      { eventId: EVENT_ID, name: "Mallory", status: "yes" },
      { "X-Tenant": "00000000-0000-4000-8000-deadbeefdead" },
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("tenant_mismatch");
  });

  test("forged X-Tenant = Globex's REAL tenant id on acme's subdomain → 400 tenant_mismatch, RSVP does NOT land in Globex (#51)", async () => {
    // The actual kumiko-platform#278/1 / show-pony#51 scenario: a guest on
    // acme.show-pony.test claims a real, active, OTHER tenant's id via the
    // header — not a garbage id tenantExists would catch anyway. Before
    // resolverTrust: "authoritative" this landed the RSVP in Globex's
    // guest list while served on Acme's subdomain (source="header" won
    // resolveTenant's precedence). Now the resolver (Acme, from the host)
    // is authoritative and a disagreeing client tenant is rejected outright.
    const res = await submit(
      "acme.show-pony.test",
      { eventId: EVENT_ID, name: "Mallory", status: "yes" },
      { "X-Tenant": GLOBEX },
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("tenant_mismatch");

    // Belt-and-suspenders: prove it structurally, not just via the status
    // code — Globex's guest list must still be empty.
    const globexList = await stack.http.query("showpony:query:rsvp:list", {}, globexHost);
    const globexBody = (await globexList.json()) as { data: { rows: Array<{ name: string }> } };
    expect(globexBody.data.rows).toHaveLength(0);
  });

  test("host CRUD rejects anonymous callers (event:create stays gated)", async () => {
    const res = await stack.http.raw(
      "POST",
      "/api/write",
      { type: "showpony:write:event:create", payload: { title: "Party", slug: "party" } },
      { Host: "acme.show-pony.test" },
    );
    expect(res.status).toBe(403);
  });

  test("apex host + X-Tenant → 400 tenant_required (apex resolves to no tenant)", async () => {
    // Proves the apex branch inside createShowPonyAnonymousAccess (only
    // exercised by the production factory, not the bare subdomain
    // resolver): the apex resolver returns null — no anonymous tenant
    // exists at apex, legal/marketing pages are static and branding reads
    // go through the separate resolveSubdomainPageTenant pipeline. With
    // resolverTrust: "authoritative" a resolver returning null never falls
    // back to a client-supplied X-Tenant, so this 400s as tenant_required,
    // same as the header-less case below.
    const res = await submit(
      BASE_DOMAIN,
      { eventId: EVENT_ID, name: "Mallory", status: "yes" },
      { "X-Tenant": ACME },
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("tenant_required");
  });

  test("apex host, no X-Tenant → 400 tenant_required (no silent SYSTEM_TENANT_ID write)", async () => {
    // Regression pin: before this fix, an apex-origin anonymous write with
    // no X-Tenant header at all silently landed on SYSTEM_TENANT_ID (200,
    // real row written) — the only things stopping it in production were
    // DEMO_READ_ONLY + the origin guard upstream, neither of which this
    // test stack exercises. The resolver itself must reject it.
    const res = await submit(BASE_DOMAIN, { eventId: EVENT_ID, name: "Mallory", status: "yes" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("tenant_required");
  });
});

describe("guest confirmation mail (mail-foundation direct)", () => {
  let seededEventId = EVENT_ID;

  beforeAll(async () => {
    const created = await stack.http.writeOk<{ id: string }>(
      "showpony:write:event:create",
      {
        title: "Rooftop Launch Party",
        slug: "rooftop-launch-mail-test",
        startsAt: "2026-09-12T19:00:00.000Z",
        guestLimit: 50,
      },
      acmeHost,
    );
    seededEventId = created.id;
  });

  test("sends a confirmation to the host tenant's inbox when email is given", async () => {
    const res = await submit("acme.show-pony.test", {
      eventId: seededEventId,
      name: "Alice",
      email: "alice@example.com",
      status: "yes",
    });
    expect(res.status).toBe(200);

    const inbox = getInbox(ACME);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.to).toBe("alice@example.com");
    // The real event title, not the "your event" fallback — proves the
    // event-title lookup in sendRsvpConfirmation actually matched a row.
    expect(inbox[0]?.subject).toContain("Rooftop Launch Party");
    // Lands in the right tenant buffer — Globex stays empty.
    expect(getInbox(GLOBEX)).toHaveLength(0);
  });

  test("escapes HTML in the guest name — no injection into the mail body", async () => {
    await submit("acme.show-pony.test", {
      eventId: EVENT_ID,
      name: "<script>alert(1)</script>",
      email: "mallory@example.com",
      status: "yes",
    });
    const mail = getInbox(ACME)[0] as { html: string } | undefined;
    expect(mail?.html).toContain("&lt;script&gt;");
    expect(mail?.html).not.toContain("<script>");
  });

  test("no mail when the guest skips the email field", async () => {
    const res = await submit("acme.show-pony.test", {
      eventId: EVENT_ID,
      name: "Bob",
      status: "maybe",
    });
    expect(res.status).toBe(200);
    expect(getInbox(ACME)).toHaveLength(0);
  });
});
