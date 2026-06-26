// Der Kern-Beweis: ein anonymer RSVP-Write landet deterministisch beim
// Host-Tenant, der aus der Subdomain (Host-Header) aufgelöst wird — nie
// beim falschen. Das ist die Lücke, die show-pony als Sample füllt.
//
// Wir fahren den ECHTEN Resolver (createShowPonyTenantResolver) gegen echte
// tenant-Rows, exakt mit der Boot-Verdrahtung aus bin/server.ts — kein
// Mock. So sind der Subdomain→key-Lookup UND der tenantExists-Guard gegen
// manipulierte X-Tenant-Header mitgetestet, nicht nur die Framework-Pipeline.

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
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
} from "@cosmicdrift/kumiko-framework/stack";
import { rsvpEntity, rsvpTable, showPonyFeature } from "../feature";
import { createShowPonyTenantResolver } from "../tenant-routing";

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
    features: [showPonyFeature],
    // Exakt die Boot-Verdrahtung aus bin/server.ts: die Factory bekommt die
    // Stack-db und baut den echten DB-Resolver.
    anonymousAccess: ({ db }) => createShowPonyTenantResolver({ db, baseDomain: BASE_DOMAIN }),
  });
  await unsafeCreateEntityTable(stack.db, tenantEntity);
  await unsafeCreateEntityTable(stack.db, rsvpEntity, "rsvp");
  await createEventsTable(stack.db);
  await seedTenant(stack.db, { id: ACME, key: "acme", name: "Acme" });
  await seedTenant(stack.db, { id: GLOBEX, key: "globex", name: "Globex" });
});

afterAll(async () => stack?.cleanup());

beforeEach(async () => {
  await asRawClient(stack.db).unsafe(`DELETE FROM "${rsvpTable.tableName}"`);
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

    // Jeder Host sieht über die tenant-scoped Gästeliste nur den eigenen Gast.
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
