// The core proof: an anonymous RSVP write lands deterministically on the host
// tenant resolved from the subdomain (Host header) — never on the wrong one.
// That's the gap show-pony fills as a sample.
//
// We run the REAL resolver (createShowPonyTenantResolver) against real tenant
// rows, with the exact boot wiring from bin/server.ts — no mock. So the
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
import { createShowPonyTenantResolver } from "../tenant-routing";

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
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    // Exact boot wiring from bin/server.ts: the factory gets the stack db and
    // builds the real DB resolver.
    anonymousAccess: ({ db }) => createShowPonyTenantResolver({ db, baseDomain: BASE_DOMAIN }),
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

  test("forged X-Tenant header → 404 (tenantExists rejects the unknown id)", async () => {
    const res = await submit(
      "acme.show-pony.test",
      { eventId: EVENT_ID, name: "Mallory", status: "yes" },
      { "X-Tenant": "00000000-0000-4000-8000-deadbeefdead" },
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("tenant_not_found");
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
});

describe("guest confirmation mail (mail-foundation direct)", () => {
  test("sends a confirmation to the host tenant's inbox when email is given", async () => {
    const res = await submit("acme.show-pony.test", {
      eventId: EVENT_ID,
      name: "Alice",
      email: "alice@example.com",
      status: "yes",
    });
    expect(res.status).toBe(200);

    const inbox = getInbox(ACME);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.to).toBe("alice@example.com");
    expect(inbox[0]?.subject).toContain("RSVP");
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


