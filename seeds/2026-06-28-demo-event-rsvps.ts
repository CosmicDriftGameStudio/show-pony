// Demo content for the deployed public page: one event on the "demo" tenant
// plus a handful of RSVPs — otherwise demo.show-pony.kumiko.rocks is empty
// until a host signs in and creates something. Matches the tutorial
// screenshots so the live demo looks like the docs.
//
// The "demo" tenant itself is created by the admin bootstrap
// (auth.admin.memberships in bin/main.ts), so this seed only adds content.
//
// Seeds run once per filename (kumiko_es_operations), but dispatcher writes
// commit outside the marker tx — retries after partial failure MUST be
// idempotent. Entity create schemas strip `id`, so guard by slug before create.

import type { SeedMigration } from "@cosmicdrift/kumiko-framework/es-ops";
import {
  DEMO_EVENT_ID,
  DEMO_TENANT_ID,
  findEventBySlug,
  toRawSqlRunner,
  WARMUP_EVENT_ID,
} from "./_demo-event-db";

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

    let rooftop = await findEventBySlug(raw, "rooftop-launch");
    if (!rooftop) {
      const event = await ctx.systemWriteAs(
        "showpony:write:event:create",
        {
          id: DEMO_EVENT_ID,
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

    let warmup = await findEventBySlug(raw, "warmup-drinks");
    if (!warmup) {
      const created = await ctx.systemWriteAs(
        "showpony:write:event:create",
        {
          id: WARMUP_EVENT_ID,
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

