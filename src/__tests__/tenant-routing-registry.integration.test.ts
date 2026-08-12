// bin/main.ts and bin/server.ts don't wire createShowPonyAnonymousAccess
// directly (that factory is for isolated test stacks only, see
// src/tenant-routing.ts). Production mounts createShowPonyTenantRoutingFeature
// (#1374) and returns `{}` from `anonymousAccess`; the actual tenantResolver /
// tenantExists functions are merged in afterwards by the framework's
// resolveAnonymousAccessFromRegistry (auth-foundation EXT_TENANT_RESOLVER /
// EXT_TENANT_EXISTENCE providers) — the same merge runProdApp/runDevApp
// perform unconditionally at boot.
//
// rsvp-anonymous.integration.test.ts covers the resolver/existence LOGIC
// against the bare factory. This file instead proves the MERGE ITSELF: that
// mounting the real feature + returning `{}` (the exact bin/main.ts /
// bin/server.ts pattern) actually produces a working tenantResolver at
// request time, AND that EXT_TENANT_EXISTENCE resolves to a real, DB-backed
// check off the same registry — so a wrong extension key, an unlucky feature
// order, or a renamed merge helper would fail this test instead of silently
// dropping the existence guard in production.

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  authFoundationFeature,
  resolveAnonymousAccessFromRegistry,
  resolveTenantExistence,
} from "@cosmicdrift/kumiko-bundled-features/auth-foundation";
import {
  configValuesTable,
  createConfigAccessorFactory,
  createConfigFeature,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { mailTransportInMemoryFeature } from "@cosmicdrift/kumiko-bundled-features/mail-transport-inmemory";
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
import { createShowPonyTenantRoutingFeature } from "../tenant-routing";

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

const BASE_DOMAIN = "show-pony-registry.test";
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
      authFoundationFeature,
      createShowPonyTenantRoutingFeature({ baseDomain: BASE_DOMAIN }),
      createConfigFeature(),
      createManagedPagesFeature({ resolveApexTenant: async () => null }),
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    // Exact boot wiring from bin/main.ts / bin/server.ts: anonymousAccess
    // returns `{}`, and the registry-mounted tenant-routing providers get
    // merged in via enrichAnonymousAccess — never the direct factory.
    anonymousAccess: () => ({}),
    enrichAnonymousAccess: (base, deps) => resolveAnonymousAccessFromRegistry(base, deps),
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
});

describe("registry-merged tenant routing (createShowPonyTenantRoutingFeature, #1374)", () => {
  test("subdomain resolves via the registry-merged resolver, not a bypassed no-op", async () => {
    const res = await submit(`acme.${BASE_DOMAIN}`, {
      eventId: EVENT_ID,
      name: "Alice",
      status: "yes",
    });
    expect(res.status).toBe(200);

    const acmeList = await stack.http.query("showpony:query:rsvp:list", {}, acmeHost);
    const acmeBody = (await acmeList.json()) as { data: { rows: Array<{ name: string }> } };
    expect(acmeBody.data.rows.map((r) => r.name)).toEqual(["Alice"]);
  });

  test("unknown subdomain → 400 tenant_required (registry resolver returned null, not silently open)", async () => {
    const res = await submit(`nope.${BASE_DOMAIN}`, {
      eventId: EVENT_ID,
      name: "Ghost",
      status: "yes",
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("tenant_required");
  });

  test("forged X-Tenant on an unrelated real tenant → 400 tenant_mismatch, RSVP does NOT land cross-tenant", async () => {
    // This 400 comes from the resolverTrust: "authoritative" mismatch guard
    // (subdomain vs. header disagree), which fires before tenantExists ever
    // runs — see rsvp-anonymous.integration.test.ts. It does NOT exercise
    // EXT_TENANT_EXISTENCE; that's covered separately below.
    const res = await submit(
      `acme.${BASE_DOMAIN}`,
      { eventId: EVENT_ID, name: "Mallory", status: "yes" },
      { "X-Tenant": GLOBEX },
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("tenant_mismatch");

    const globexList = await stack.http.query("showpony:query:rsvp:list", {}, globexHost);
    const globexBody = (await globexList.json()) as { data: { rows: Array<{ name: string }> } };
    expect(globexBody.data.rows).toHaveLength(0);
  });

  test("registry-merged EXT_TENANT_EXISTENCE provider is wired and DB-backed", async () => {
    // The mismatch guard above never reaches tenantExists, so it can't prove
    // this half of the finding's worry (existence check silently falling
    // away — wrong extension key, feature-order change, renamed merge
    // helper). Resolve the provider straight off the real registry, the same
    // way runProdApp/runDevApp do internally, and prove it's backed by real
    // seeded rows, not a stub that always returns true.
    const exists = await resolveTenantExistence({ db: stack.db, registry: stack.registry });
    expect(exists).not.toBeNull();
    expect(await exists?.(ACME)).toBe(true);
    expect(await exists?.(testTenantId(999))).toBe(false);
  });
});
