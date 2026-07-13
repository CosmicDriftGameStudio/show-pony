// Demo content for the deployed public page: Rooftop Launch + Winter Warmup +
// sample RSVPs on the "demo" tenant. Matches tutorial screenshots.
//
// This is the **only** dated seed for demo content — show-pony is a learning
// sample with a resettable prod DB (see README "Demo ops"). Do not add repair
// migrations; edit this file and reset the database.
//
// Tenants + accounts come from boot seeds in bin/main.ts / bin/server.ts.
// Seeds run once per filename (kumiko_es_operations). Dispatcher writes commit
// outside the marker tx — retries MUST be idempotent (slug guard before create).

import type { SeedMigration } from "@cosmicdrift/kumiko-framework/es-ops";
import {
  DEMO_EVENT_ID,
  DEMO_TENANT_ID,
  findEventBySlug,
  toRawSqlRunner,
} from "./_demo-event-db";
import type { ShowPonyTier } from "../src/marketing/pricing";

const DEMO_TIER: ShowPonyTier = "studio";

const ROOFTOP_DESC =
  "Join us on the 24th floor for cocktails, a live DJ set, and the Show Pony 2.0 launch at midnight. Dress code: rooftop-ready. Bring someone you'd introduce to the team.";

const GUESTS = [
  { name: "Ava Chen", status: "yes", plusN: 2 },
  { name: "Marcus Bell", status: "yes", plusN: 0 },
  { name: "Priya Raman", status: "maybe", plusN: 1 },
  { name: "Diego Santos", status: "no", plusN: 0 },
] as const;

export default {
  description: "demo tenant content: Rooftop Launch Party + Winter Warmup + sample RSVPs",
  run: async (ctx) => {
    const raw = toRawSqlRunner(ctx.db);

    // free tier caps maxEvents at 1; the demo seeds 2 events → grant headroom before create.
    await ctx.systemWriteAs(
      // literal QN, not the TierEngineHandlers const: seeds/ runs unbundled at boot
      // and cannot resolve the bundled-features subpath at runtime.
      "tier-engine:write:set-tenant-tier",
      { tenantId: DEMO_TENANT_ID, tier: DEMO_TIER },
      DEMO_TENANT_ID,
    );

    let rooftop = await findEventBySlug(raw, "rooftop-launch");
    if (rooftop) {
      await ctx.systemWriteAs(
        "showpony:write:event:update",
        {
          id: rooftop.id,
          version: rooftop.version,
          changes: { description: ROOFTOP_DESC },
        },
        DEMO_TENANT_ID,
      );
    } else {
      const event = await ctx.systemWriteAs(
        "showpony:write:event:create",
        {
          title: "Rooftop Launch Party",
          slug: "rooftop-launch",
          startsAt: "2026-09-12T19:00:00.000Z",
          location: "Sky Lounge, 24th floor",
          description: ROOFTOP_DESC,
          guestLimit: 80,
        },
        DEMO_TENANT_ID,
      );
      if (!event.isSuccess) {
        throw new Error(
          `show-pony seed: event:create failed — ${event.error.code}: ${event.error.message}`,
        );
      }
      rooftop = await findEventBySlug(raw, "rooftop-launch");
    }

    const warmup = await findEventBySlug(raw, "warmup-drinks");
    if (!warmup) {
      const created = await ctx.systemWriteAs(
        "showpony:write:event:create",
        {
          title: "Winter Warmup Drinks",
          slug: "warmup-drinks",
          startsAt: "2026-11-28T18:00:00.000Z",
          location: "Ground-floor bar",
          description:
            "Low-key pre-holiday drinks for the team and friends. No agenda — just show up.",
          guestLimit: 40,
        },
        DEMO_TENANT_ID,
      );
      if (!created.isSuccess) {
        throw new Error(
          `show-pony seed: warmup event failed — ${created.error.code}: ${created.error.message}`,
        );
      }
    }

    const eventId = rooftop?.id ?? DEMO_EVENT_ID;

    for (const guest of GUESTS) {
      // systemWriteAs THROWS on a failed write. rsvp:submit declares a rateLimit
      // (mandatory for anon writes), but the es-ops seed dispatcher has no
      // RateLimitResolver in prod (it's separate from the HTTP dispatcher) — so
      // catch + skip. A demo RSVP must never crash the prod boot; the event
      // above is the critical content, and the public RSVP form (HTTP path,
      // which DOES have the resolver) works for real guests regardless.
      try {
        await ctx.systemWriteAs(
          "showpony:write:rsvp:submit",
          { eventId, ...guest },
          DEMO_TENANT_ID,
        );
      } catch (err) {
        console.warn(
          `show-pony seed: rsvp:submit skipped for ${guest.name} — ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  },
} satisfies SeedMigration;
