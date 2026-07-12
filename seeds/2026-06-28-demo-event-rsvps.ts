// Demo content for the deployed public page: one event on the "demo" tenant
// plus a handful of RSVPs — otherwise demo.show-pony.kumiko.rocks is empty
// until a host signs in and creates something. Matches the tutorial
// screenshots so the live demo looks like the docs.
//
// The "demo" tenant itself is created by the admin bootstrap
// (auth.admin.memberships in bin/main.ts), so this seed only adds content.
//
// Seeds run once per filename (tracked in kumiko_es_operations) — re-runs are
// skipped, so no manual idempotency guard is needed.

import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import type { SeedMigration } from "@cosmicdrift/kumiko-framework/es-ops";

const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;
// Explicit aggregate id (the framework's seed pattern) so the RSVPs can
// reference the event without reading back the create result.
const DEMO_EVENT_ID = "00000000-0000-4000-8000-0000000000e1";
const WARMUP_EVENT_ID = "00000000-0000-4000-8000-0000000000e2";

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
      throw new Error(`show-pony seed: event:create failed — ${event.error.code}: ${event.error.message}`);
    }

    const warmup = await ctx.systemWriteAs(
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
    if (!warmup.isSuccess) {
      throw new Error(`show-pony seed: warmup event failed — ${warmup.error.code}: ${warmup.error.message}`);
    }

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
          { eventId: DEMO_EVENT_ID, ...guest },
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



