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
import { asRawClient } from "@cosmicdrift/kumiko-framework/bun-db";
import type { SessionUser } from "@cosmicdrift/kumiko-framework/engine";
import { type TestStack, unsafePushTables } from "@cosmicdrift/kumiko-framework/stack";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { rsvpTable, showPonyFeature } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { createShowPonyAnonymousAccess } from "../tenant-routing";

// Default the mail provider app-wide to inmemory (otherwise createTransportForTenant
// throws "no provider selected") — the same appOverride as in bin/server.ts.
const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

const BASE_DOMAIN = "show-pony.test";
const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";

let stack: TestStack;
let acmeId: string;
let globexId: string;
let acmeHostname: string;
let globexHostname: string;
let acmeEventId: string;
let globexEventId: string;
let acmeHost: SessionUser;
let globexHost: SessionUser;

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
  stack = await setupAppTestStack(
    [
      createConfigFeature(),
      createManagedPagesFeature({ resolveApexTenant: async () => null }),
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    {
      // Exact boot wiring from bin/server.ts: the factory gets the stack db
      // and builds the real DB resolver.
      anonymousAccess: ({ db }) => createShowPonyAnonymousAccess({ db, baseDomain: BASE_DOMAIN }),
      extraContext: ({ registry }) => ({
        configResolver,
        _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
      }),
    },
  );
  await unsafePushTables(stack.db, {
    configValuesTable,
    tier_assignments: tierAssignmentTable,
  });
  // Subdomain routing resolves the tenant via a real DB lookup by key
  // (tenant-routing.ts enabledTenantByKey) — needs persisted rows.
  const acme = await seedTenant(stack, { name: "Acme", persist: true });
  const globex = await seedTenant(stack, { name: "Globex", persist: true });
  acmeId = acme.id;
  globexId = globex.id;
  acmeHostname = `${acme.key}.${BASE_DOMAIN}`;
  globexHostname = `${globex.key}.${BASE_DOMAIN}`;
  acmeHost = (await acme.addUser(["Admin"])).session;
  globexHost = (await globex.addUser(["Admin"])).session;

  // The rsvp:submit event-existence guard rejects any
  // eventId that doesn't resolve to a real, tenant-scoped event row — every
  // test that expects a submit to actually reach the handler needs one.
  const acmeEvent = await stack.http.writeOk<{ id: string }>(
    "showpony:write:event:create",
    {
      title: "Rooftop Launch Party",
      slug: "rooftop-launch-mail-test",
      startsAt: "2026-09-12T19:00:00.000Z",
      guestLimit: 50,
    },
    acmeHost,
  );
  acmeEventId = acmeEvent.id;

  const globexEvent = await stack.http.writeOk<{ id: string }>(
    "showpony:write:event:create",
    {
      title: "Globex Kickoff",
      slug: "globex-kickoff",
      startsAt: "2026-09-13T19:00:00.000Z",
      guestLimit: 50,
    },
    globexHost,
  );
  globexEventId = globexEvent.id;
});

afterAll(async () => stack?.cleanup());

beforeEach(async () => {
  await asRawClient(stack.db).unsafe(`DELETE FROM "${rsvpTable.tableName}"`);
  clearInbox(acmeId);
  clearInbox(globexId);
});

describe("anonymous multi-tenant RSVP write (real resolver)", () => {
  test("RSVP lands on the host tenant resolved from the subdomain", async () => {
    const acme = await submit(acmeHostname, {
      eventId: acmeEventId,
      name: "Alice",
      status: "yes",
      plusN: 1,
    });
    expect(acme.status).toBe(200);

    const globex = await submit(globexHostname, {
      eventId: globexEventId,
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

  test("unknown but well-formed eventId → 404 not_found, no rsvp row is created", async () => {
    const res = await submit(acmeHostname, {
      eventId: "00000000-0000-4000-8000-0000000000ff",
      name: "Ghost",
      status: "yes",
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("not_found");

    const acmeList = await stack.http.query("showpony:query:rsvp:list", {}, acmeHost);
    const acmeBody = (await acmeList.json()) as { data: { rows: Array<{ name: string }> } };
    expect(acmeBody.data.rows.map((r) => r.name)).not.toContain("Ghost");
  });

  test("Globex's real eventId submitted on Acme's subdomain → 404 not_found, tenant-scoped guard excludes foreign tenants", async () => {
    const res = await submit(acmeHostname, {
      eventId: globexEventId,
      name: "Mallory",
      status: "yes",
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("not_found");

    const acmeList = await stack.http.query("showpony:query:rsvp:list", {}, acmeHost);
    const acmeBody = (await acmeList.json()) as { data: { rows: Array<{ name: string }> } };
    expect(acmeBody.data.rows.map((r) => r.name)).not.toContain("Mallory");
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
      acmeHostname,
      { eventId: EVENT_ID, name: "Mallory", status: "yes" },
      { "X-Tenant": "00000000-0000-4000-8000-deadbeefdead" },
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("tenant_mismatch");
  });

  test("forged X-Tenant = Globex's REAL tenant id on acme's subdomain → 400 tenant_mismatch, RSVP does NOT land in Globex (#51)", async () => {
    // A guest on
    // acme.show-pony.test claims a real, active, OTHER tenant's id via the
    // header — not a garbage id tenantExists would catch anyway. Before
    // resolverTrust: "authoritative" this landed the RSVP in Globex's
    // guest list while served on Acme's subdomain (source="header" won
    // resolveTenant's precedence). Now the resolver (Acme, from the host)
    // is authoritative and a disagreeing client tenant is rejected outright.
    const res = await submit(
      acmeHostname,
      { eventId: EVENT_ID, name: "Mallory", status: "yes" },
      { "X-Tenant": globexId },
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
      { Host: acmeHostname },
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
      { "X-Tenant": acmeId },
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
  test("sends a confirmation to the host tenant's inbox when email is given", async () => {
    const res = await submit(acmeHostname, {
      eventId: acmeEventId,
      name: "Alice",
      email: "alice@example.com",
      status: "yes",
    });
    expect(res.status).toBe(200);

    const inbox = getInbox(acmeId);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.to).toBe("alice@example.com");
    // The real event title, not the "your event" fallback — proves the
    // event-title lookup in sendRsvpConfirmation actually matched a row.
    expect(inbox[0]?.subject).toContain("Rooftop Launch Party");
    // Lands in the right tenant buffer — Globex stays empty.
    expect(getInbox(globexId)).toHaveLength(0);
  });

  test("escapes HTML in the guest name — no injection into the mail body", async () => {
    await submit(acmeHostname, {
      eventId: acmeEventId,
      name: "<script>alert(1)</script>",
      email: "mallory@example.com",
      status: "yes",
    });
    const mail = getInbox(acmeId)[0] as { html: string } | undefined;
    expect(mail?.html).toContain("&lt;script&gt;");
    expect(mail?.html).not.toContain("<script>");
  });

  test("no mail when the guest skips the email field", async () => {
    const res = await submit(acmeHostname, {
      eventId: acmeEventId,
      name: "Bob",
      status: "maybe",
    });
    expect(res.status).toBe(200);
    expect(getInbox(acmeId)).toHaveLength(0);
  });
});
