// Production mounts createShowPonyTenantRoutingFeature (#1374) and returns `{}`
// from anonymousAccess; tenantResolver / tenantExists are merged afterwards via
// resolveAnonymousAccessFromRegistry (same as bin/main.ts / bin/server.ts).
//
// rsvp-anonymous.integration.test.ts covers resolver/existence logic on the bare
// factory. This file proves the merged registry providers deliver a working
// tenantResolver at request time and a DB-backed EXT_TENANT_EXISTENCE check.

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  resolveAnonymousAccessFromRegistry,
  resolveTenantExistence,
} from "@cosmicdrift/kumiko-bundled-features/auth-foundation";
import {
  configValuesTable,
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { asRawClient } from "@cosmicdrift/kumiko-framework/bun-db";
import type { SessionUser } from "@cosmicdrift/kumiko-framework/engine";
import {
  type TestStack,
  testTenantId,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { rsvpTable } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { buildAppFeatures } from "../run-config";

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

const BASE_DOMAIN = "show-pony-registry.test";
// Empty until beforeAll assigns create id — leftover UUID silently passes z.uuid() (show-pony#134/3).
let seededEventId = "";

let stack: TestStack;
let acmeId: string;
let globexId: string;
let acmeHostname: string;
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
  stack = await setupAppTestStack(buildAppFeatures({ baseDomain: BASE_DOMAIN }), {
    // bin/main.ts pattern: anonymousAccess returns `{}`; registry merge supplies resolver.
    anonymousAccess: () => ({}),
    enrichAnonymousAccess: (base, deps) => resolveAnonymousAccessFromRegistry(base, deps),
    extraContext: ({ registry }) => ({
      configResolver,
      _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    }),
  });
  await unsafePushTables(stack.db, {
    configValuesTable,
    tier_assignments: tierAssignmentTable,
  });
  // Subdomain routing resolves the tenant via a real DB lookup by key, and
  // the EXT_TENANT_EXISTENCE assertion below reads the real tenant row.
  const acme = await seedTenant(stack, { name: "Acme", persist: true });
  const globex = await seedTenant(stack, { name: "Globex", persist: true });
  acmeId = acme.id;
  globexId = globex.id;
  acmeHostname = `${acme.key}.${BASE_DOMAIN}`;
  acmeHost = (await acme.addUser(["Admin"])).session;
  globexHost = (await globex.addUser(["Admin"])).session;

  const created = await stack.http.writeOk<{ id: string }>(
    "showpony:write:event:create",
    {
      title: "Registry routing test event",
      slug: "registry-routing-test",
      startsAt: "2026-09-12T19:00:00.000Z",
      guestLimit: 50,
    },
    acmeHost,
  );
  seededEventId = created.id;
});

afterAll(async () => stack?.cleanup());

beforeEach(async () => {
  await asRawClient(stack.db).unsafe(`DELETE FROM "${rsvpTable.tableName}"`);
});

describe("registry-merged tenant routing (createShowPonyTenantRoutingFeature, #1374)", () => {
  test("subdomain resolves via the registry-merged resolver, not a bypassed no-op", async () => {
    const res = await submit(acmeHostname, {
      eventId: seededEventId,
      name: "Alice",
      status: "yes",
    });
    expect(res.status).toBe(200);

    const acmeList = await stack.http.query("showpony:query:rsvp:list", {}, acmeHost);
    const acmeBody = (await acmeList.json()) as {
      data: { rows: Array<{ name: string; eventId: string }> };
    };
    expect(acmeBody.data.rows.map((r) => r.name)).toEqual(["Alice"]);
    expect(acmeBody.data.rows[0]?.eventId).toBe(seededEventId);
  });

  test("unknown subdomain → 400 tenant_required (registry resolver returned null, not silently open)", async () => {
    const res = await submit(`nope.${BASE_DOMAIN}`, {
      eventId: seededEventId,
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
      acmeHostname,
      { eventId: seededEventId, name: "Mallory", status: "yes" },
      { "X-Tenant": globexId },
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
    expect(await exists?.(acmeId)).toBe(true);
    expect(await exists?.(testTenantId(999))).toBe(false);
  });
});
