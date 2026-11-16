// Event guest limit + duplicate-email rejection on rsvp:submit over real HTTP.
// Every test seeds its own tenant: the free tier allows one event per tenant.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createInMemoryTransport } from "@cosmicdrift/kumiko-bundled-features/channel-email";
import {
  configValuesTable,
  createConfigAccessorFactory,
  createConfigFeature,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { createManagedPagesFeature } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-dev-server/testing";
import type { SessionUser } from "@cosmicdrift/kumiko-framework/engine";
import { type TestStack, unsafePushTables } from "@cosmicdrift/kumiko-testing/stack";
import { propertyOf } from "@cosmicdrift/kumiko-types/type-guards";
import { showPonyFeature } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { TIER_MAX_GUESTS } from "../marketing/pricing";
import { deliveryFeatures } from "./delivery-stack";

let stack: TestStack;

const configResolver = createConfigResolver();
const emailTransport = createInMemoryTransport();
const managedPages = createManagedPagesFeature({ resolveApexTenant: async () => null });

beforeAll(async () => {
  stack = await setupAppTestStack(
    [createConfigFeature(), managedPages, ...deliveryFeatures(emailTransport), showPonyFeature],
    {
      trustedProxyHops: 1,
      extraContext: ({ registry }) => ({
        configResolver,
        configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
      }),
    },
  );
  await unsafePushTables(stack.db, {
    tier_assignments: tierAssignmentTable,
    config_values: configValuesTable,
  });
});

afterAll(async () => stack?.cleanup());

type RsvpPayload = {
  readonly eventId: string;
  readonly name: string;
  readonly status: "yes" | "no" | "maybe";
  readonly plusN?: number;
  readonly email?: string;
};

async function seedHostWithEvent(
  name: string,
  guestLimit?: number,
): Promise<{ host: SessionUser; eventId: string }> {
  const tenant = await seedTenant(stack, { name });
  const host = (await tenant.addUser(["Admin"])).session;
  const event = await stack.http.writeOk<{ id: string }>(
    "showpony:write:event:create",
    {
      title: name,
      slug: name.toLowerCase().replaceAll(" ", "-"),
      startsAt: "2026-09-12T19:00:00.000Z",
      ...(guestLimit !== undefined && { guestLimit }),
    },
    host,
  );
  return { host, eventId: event.id };
}

function submit(host: SessionUser, payload: RsvpPayload, ip: string): Promise<Response> {
  return stack.http.writeWithHeaders(
    "showpony:write:rsvp:submit",
    payload,
    { ...host, roles: ["anonymous"] },
    { "x-forwarded-for": ip },
  );
}

async function rejectionReason(res: Response): Promise<unknown> {
  const body: unknown = await res.json();
  return propertyOf(propertyOf(propertyOf(body, "error"), "details"), "reason");
}

function listRsvps(host: SessionUser) {
  return stack.http.queryOk<{
    rows: ReadonlyArray<{ id: string; status: string; plusN: number | null }>;
  }>("showpony:query:rsvp:list", {}, host);
}

describe("rsvp:submit guest limit and duplicates", () => {
  test("a yes that would exceed the event's guest limit is rejected with event_full, counting additional guests", async () => {
    const { host, eventId } = await seedHostWithEvent("Limit Counting", 3);
    const first = await submit(host, { eventId, name: "A", status: "yes", plusN: 1 }, "10.0.0.1");
    expect(first.status).toBe(200);
    const second = await submit(host, { eventId, name: "B", status: "yes", plusN: 1 }, "10.0.0.2");
    expect(second.status).toBe(422);
    expect(await rejectionReason(second)).toBe("event_full");
    const third = await submit(host, { eventId, name: "C", status: "yes", plusN: 0 }, "10.0.0.3");
    expect(third.status).toBe(200);
    expect((await listRsvps(host)).rows).toHaveLength(2);
  });

  test("no and maybe replies neither use nor get blocked by the guest limit", async () => {
    const { host, eventId } = await seedHostWithEvent("Limit Non Yes", 1);
    expect((await submit(host, { eventId, name: "A", status: "yes" }, "10.0.1.1")).status).toBe(200);
    expect((await submit(host, { eventId, name: "B", status: "no" }, "10.0.1.2")).status).toBe(200);
    expect(
      (await submit(host, { eventId, name: "C", status: "maybe", plusN: 2 }, "10.0.1.3")).status,
    ).toBe(200);
    const full = await submit(host, { eventId, name: "D", status: "yes" }, "10.0.1.4");
    expect(full.status).toBe(422);
    expect(await rejectionReason(full)).toBe("event_full");
  });

  test("an event without a guest limit accepts replies up to the plan quota", async () => {
    const { host, eventId } = await seedHostWithEvent("No Limit");
    for (let i = 0; i < 3; i++) {
      const res = await submit(host, { eventId, name: `G${i}`, status: "yes", plusN: 5 }, `10.0.2.${i}`);
      expect(res.status).toBe(200);
    }
  });

  test("concurrent yes replies never overbook the guest limit", async () => {
    const { host, eventId } = await seedHostWithEvent("Limit Race", 2);
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        submit(host, { eventId, name: `Racer ${i}`, status: "yes" }, `10.0.3.${i}`),
      ),
    );
    const accepted = responses.filter((res) => res.status === 200);
    const rejected = responses.filter((res) => res.status === 422);
    expect(accepted).toHaveLength(2);
    expect(rejected).toHaveLength(4);
    for (const res of rejected) expect(await rejectionReason(res)).toBe("event_full");
    expect((await listRsvps(host)).rows).toHaveLength(2);
  });

  test("a second reply with the same email to the same event is rejected and sends no second mail", async () => {
    const { host, eventId } = await seedHostWithEvent("Duplicate Email", 10);
    emailTransport.sent.length = 0;
    const email = "dup@example.test";
    const first = await submit(host, { eventId, name: "Dup", status: "yes", email }, "10.0.4.1");
    expect(first.status).toBe(200);
    const second = await submit(host, { eventId, name: "Dup", status: "maybe", email }, "10.0.4.2");
    expect(second.status).toBe(422);
    expect(await rejectionReason(second)).toBe("rsvp_already_submitted");
    expect(emailTransport.sent).toHaveLength(1);
    expect((await listRsvps(host)).rows).toHaveLength(1);
  });

  test("replies without an email are never treated as duplicates", async () => {
    const { host, eventId } = await seedHostWithEvent("No Email", 10);
    expect((await submit(host, { eventId, name: "A", status: "yes" }, "10.0.5.1")).status).toBe(200);
    expect((await submit(host, { eventId, name: "B", status: "yes" }, "10.0.5.2")).status).toBe(200);
  });

  test("the plan quota keeps its own reason", async () => {
    const maxGuests = TIER_MAX_GUESTS.free;
    if (maxGuests === null) throw new Error("free tier has no guest cap — test premise broken");
    const { host, eventId } = await seedHostWithEvent("Plan Quota", 1000);
    for (let i = 0; i < maxGuests; i++) {
      const res = await submit(host, { eventId, name: `Guest ${i}`, status: "no" }, `10.1.0.${i}`);
      expect(res.status).toBe(200);
    }
    const over = await submit(host, { eventId, name: "One Too Many", status: "yes" }, "10.2.0.1");
    expect(over.status).toBe(422);
    expect(await rejectionReason(over)).toBe("guest_limit_reached");
  });
});
