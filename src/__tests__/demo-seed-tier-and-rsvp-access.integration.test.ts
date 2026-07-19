// Real Postgres + real dispatcher (setupTestStack + the app's actual
// APP_FEATURES) — targets exactly the two paths the demo seed's
// (seeds/2026-06-28-demo-event-rsvps.ts) systemWriteAs calls needed
// extraRoles for, after a prod reset-db surfaced both as real failures:
//   - event:create is stock-capped by tier (free tier = 1 event); the
//     demo tenant needs 2, so the seed grants "starter" via a
//     SystemAdmin-gated set-tenant-tier write.
//   - rsvp:submit is gated on access.anonymous; the bare system actor has
//     neither role without extraRoles.
// Not a full seed.run() rehearsal — the other seed paths (branding config,
// idempotent event:update) are unaffected by this fix and stay covered by
// the existing mock-based seed-boot-safety.test.ts.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createSeedMigrationContext } from "@cosmicdrift/kumiko-framework/es-ops";
import {
  setupTestStack,
  type TestStack,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import { composeFeatures } from "@cosmicdrift/kumiko-server-runtime/compose-features";
import { DEMO_TENANT_ID } from "../../seeds/_demo-event-db";
import { eventTable } from "../features/show-pony/schema/event";
import { rsvpTable } from "../features/show-pony/schema/rsvp";
import { resolveTierCaps, tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { APP_FEATURES } from "../run-config";

let stack: TestStack;

beforeAll(async () => {
  // Mirrors bin/main.ts's real bootstrap: APP_FEATURES alone omits the
  // bundled auth chain (config/user/tenant/auth-email-password) that
  // runProdApp adds via HAS_AUTH — composeFeatures is the single source of
  // truth for that composition.
  stack = await setupTestStack({
    features: composeFeatures(APP_FEATURES, { includeBundled: true }),
  });
  // setupTestStack auto-creates projection tables but not entity CRUD
  // tables — same recipe as billing-webhook.integration.test.ts.
  await unsafePushTables(stack.db, {
    tier_assignments: tierAssignmentTable,
    events: eventTable,
    rsvps: rsvpTable,
  });
});

afterAll(async () => {
  await stack.cleanup();
});

function eventPayload(slug: string) {
  return {
    title: `Seed test — ${slug}`,
    slug,
    startsAt: "2026-09-12T19:00:00.000Z",
    location: "Test venue",
    description: "Integration-test event.",
    guestLimit: 10,
  };
}

describe("demo seed fix: set-tenant-tier grant + rsvp:submit extraRoles", () => {
  test("SystemAdmin-gated set-tenant-tier grant lifts the free-tier 1-event cap", async () => {
    const ctx = createSeedMigrationContext({ dispatcher: stack.dispatcher, dbRunner: stack.db });

    const before = await resolveTierCaps(stack.db, DEMO_TENANT_ID);
    expect(before.maxEvents).toBe(1);

    const grant = await ctx.systemWriteAs(
      "tier-engine:write:set-tenant-tier",
      { tenantId: DEMO_TENANT_ID, tier: "starter" },
      undefined,
      ["SystemAdmin"],
    );
    expect(grant.isSuccess).toBe(true);

    const after = await resolveTierCaps(stack.db, DEMO_TENANT_ID);
    expect(after.maxEvents).toBeGreaterThan(1);

    const first = await ctx.systemWriteAs(
      "showpony:write:event:create",
      eventPayload("tier-grant-event-one"),
      DEMO_TENANT_ID,
    );
    expect(first.isSuccess).toBe(true);

    // Before the grant, this second create failed with upgrade_required
    // (free tier caps at 1 event) — this proves the grant actually raised
    // the cap, not just that event:create works in isolation.
    const second = await ctx.systemWriteAs(
      "showpony:write:event:create",
      eventPayload("tier-grant-event-two"),
      DEMO_TENANT_ID,
    );
    expect(second.isSuccess).toBe(true);
  });

  test('extraRoles: ["anonymous"] reaches rsvp:submit (access.anonymous-gated)', async () => {
    const ctx = createSeedMigrationContext({ dispatcher: stack.dispatcher, dbRunner: stack.db });

    const event = await ctx.systemWriteAs(
      "showpony:write:event:create",
      eventPayload("rsvp-access-target"),
      DEMO_TENANT_ID,
    );
    expect(event.isSuccess).toBe(true);
    if (!event.isSuccess) throw new Error(`event:create failed: ${event.error?.code}`);
    const eventId = (event.data as { id: string }).id;

    // Without extraRoles this fails with access_denied: rsvp:submit only
    // allows role "anonymous", and the bare system actor has neither that
    // nor any other matching role.
    // systemWriteAs throws on any non-success WriteResult (see its own doc),
    // so a denied write surfaces as a rejected promise, not isSuccess:false.
    await expect(
      ctx.systemWriteAs("showpony:write:rsvp:submit", {
        eventId,
        name: "No Roles",
        status: "yes",
        plusN: 0,
      }),
    ).rejects.toThrow(/access_denied/);

    const rsvp = await ctx.systemWriteAs(
      "showpony:write:rsvp:submit",
      { eventId, name: "Test Guest", status: "yes", plusN: 0 },
      DEMO_TENANT_ID,
      ["anonymous"],
    );
    expect(rsvp.isSuccess).toBe(true);
  });
});
