// Event slug uniqueness per tenant, RSVP cascade on event delete and the guest note,
// over real HTTP against the app's actual feature set.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-dev-server/testing";
import type { SessionUser } from "@cosmicdrift/kumiko-framework/engine";
import { createTestUser } from "@cosmicdrift/kumiko-framework/seeding";
import { type TestStack, unsafePushTables } from "@cosmicdrift/kumiko-testing/stack";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { buildAppFeatures, resolveBaseDomainFromEnv } from "../run-config";

let stack: TestStack;
let nextIp = 1;

const sysadmin = createTestUser({
  id: "integrity-sysadmin",
  tenantId: "00000000-0000-4000-8000-000000000001",
  roles: ["SystemAdmin"],
});

beforeAll(async () => {
  stack = await setupAppTestStack(
    buildAppFeatures({ baseDomain: resolveBaseDomainFromEnv(process.env) }),
    { trustedProxyHops: 1 },
  );
  await unsafePushTables(stack.db, { tier_assignments: tierAssignmentTable });
});

afterAll(async () => stack?.cleanup());

async function seedHost(name: string): Promise<SessionUser> {
  const tenant = await seedTenant(stack, { name });
  return (await tenant.addUser(["Admin"])).session;
}

async function grantStarter(host: SessionUser): Promise<void> {
  await stack.http.writeOk(
    "tier-engine:write:set-tenant-tier",
    { tenantId: host.tenantId, tier: "starter" },
    sysadmin,
  );
}

function createEvent(host: SessionUser, slug: string): Promise<{ id: string }> {
  return stack.http.writeOk<{ id: string }>(
    "showpony:write:event:create",
    { title: slug, slug, startsAt: "2026-09-12T19:00:00.000Z" },
    host,
  );
}

async function submitRsvp(
  host: SessionUser,
  eventId: string,
  name: string,
  note?: string,
): Promise<void> {
  const res = await stack.http.writeWithHeaders(
    "showpony:write:rsvp:submit",
    { eventId, name, status: "yes", ...(note !== undefined && { note }) },
    { ...host, roles: ["anonymous"] },
    { "x-forwarded-for": `10.9.0.${nextIp++}` },
  );
  expect(res.status).toBe(200);
}

function listRsvps(host: SessionUser) {
  return stack.http.queryOk<{
    rows: ReadonlyArray<{ id: string; eventId: string; note: string | null }>;
  }>("showpony:query:rsvp:list", {}, host);
}

describe("event slug uniqueness", () => {
  test("a second event with a taken slug in the same tenant is rejected with unique_violation", async () => {
    const host = await seedHost("Slug Dup Create");
    await grantStarter(host);
    await createEvent(host, "summer-party");

    const err = await stack.http.writeErr(
      "showpony:write:event:create",
      { title: "Again", slug: "summer-party", startsAt: "2026-09-12T19:00:00.000Z" },
      host,
    );
    expect(err.httpStatus).toBe(409);
    expect(err.code).toBe("unique_violation");
  });

  test("renaming an event to a taken slug is rejected", async () => {
    const host = await seedHost("Slug Dup Update");
    await grantStarter(host);
    await createEvent(host, "a-party");
    const b = await createEvent(host, "b-party");

    const err = await stack.http.writeErr(
      "showpony:write:event:update",
      { id: b.id, version: 1, changes: { slug: "a-party" } },
      host,
    );
    expect(err.httpStatus).toBe(409);
    expect(err.code).toBe("unique_violation");
  });

  test("the same slug in two tenants is allowed", async () => {
    const first = await seedHost("Slug Tenant One");
    const second = await seedHost("Slug Tenant Two");
    await createEvent(first, "shared-slug");
    await createEvent(second, "shared-slug");
  });
});

describe("rsvp lifecycle", () => {
  test("deleting an event deletes its rsvps and keeps the other event's", async () => {
    const host = await seedHost("Cascade Delete");
    await grantStarter(host);
    const a = await createEvent(host, "event-a");
    const b = await createEvent(host, "event-b");
    await submitRsvp(host, a.id, "Guest A1");
    await submitRsvp(host, a.id, "Guest A2");
    await submitRsvp(host, b.id, "Guest B1");

    await stack.http.writeOk("showpony:write:event:delete", { id: a.id }, host);

    const { rows } = await listRsvps(host);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.eventId).toBe(b.id);
  });

  test("a guest note reaches the host's guest list", async () => {
    const host = await seedHost("Guest Note");
    const event = await createEvent(host, "note-party");
    await submitRsvp(host, event.id, "Noted Guest", "Vegetarian");

    const { rows } = await listRsvps(host);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.note).toBe("Vegetarian");
  });
});
