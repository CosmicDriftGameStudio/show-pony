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
import { BRANDING_QN } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import { INVITE_BRANDING_QN } from "../src/features/show-pony/invite-branding";
import {
  ACME_TENANT_ID,
  DEMO_EVENT_ID,
  DEMO_TENANT_ID,
  findEventBySlug,
  toRawSqlRunner,
} from "./_demo-event-db";

async function seedInviteBranding(
  ctx: Parameters<SeedMigration["run"]>[0],
  tenantId: TenantId,
  entries: ReadonlyArray<readonly [string, string]>,
): Promise<void> {
  for (const [key, value] of entries) {
    await ctx.systemWriteAs("config:write:set", { key, value }, tenantId);
  }
}

const ROOFTOP_DESC =
  "Join us on the 24th floor for cocktails, a live DJ set, and the Show Pony 2.0 launch at midnight. Dress code: rooftop-ready. Bring someone you'd introduce to the team.";

const GUESTS = [
  { name: "Ava Chen", status: "yes", plusN: 2 },
  { name: "Marcus Bell", status: "yes", plusN: 0 },
  { name: "Priya Raman", status: "maybe", plusN: 1 },
  { name: "Diego Santos", status: "no", plusN: 0 },
] as const;

export default {
  description:
    "demo tenant content: Rooftop Launch Party + sample RSVPs (demo) + seeded event (acme)",
  run: async (ctx) => {
    const raw = toRawSqlRunner(ctx.db);

    let rooftop = await findEventBySlug(raw, DEMO_TENANT_ID, "rooftop-launch");
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
      rooftop = await findEventBySlug(raw, DEMO_TENANT_ID, "rooftop-launch");
    }

    const warmup = await findEventBySlug(raw, DEMO_TENANT_ID, "warmup-drinks");
    if (!warmup) {
      // Winter Warmup is best-effort: free tier caps maxEvents at 1 (spent by
      // Rooftop), so this create throws upgrade_required — skip, don't crash boot.
      // ponytail: 1-event demo on free tier; grant the demo tenant a paid tier via
      // the tier-admin screen + DB reset to restore the full 2-event demo.
      try {
        await ctx.systemWriteAs(
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
      } catch (err) {
        console.warn(
          `show-pony seed: warmup event skipped — ${err instanceof Error ? err.message : String(err)}`,
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

    // Second tenant for isolation demo — keep it cap-safe (one event only).
    const acme = await findEventBySlug(raw, ACME_TENANT_ID, "acme-offsite");
    if (!acme) {
      try {
        await ctx.systemWriteAs(
          "showpony:write:event:create",
          {
            title: "Acme Offsite RSVP",
            slug: "acme-offsite",
            startsAt: "2026-10-03T18:00:00.000Z",
            location: "Acme HQ — Studio floor",
            description: "Acme’s internal offsite invite. Separate tenant, separate guest list.",
            guestLimit: 60,
          },
          ACME_TENANT_ID,
        );
      } catch (err) {
        console.warn(
          `show-pony seed: acme event skipped — ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    await seedInviteBranding(ctx, DEMO_TENANT_ID, [
      [BRANDING_QN.title, "Mira Events"],
      [BRANDING_QN.description, "Boutique launch invites with a rooftop vibe."],
      [BRANDING_QN.accentColor, "#7c3aed"],
      [INVITE_BRANDING_QN.heroImageUrl, "/heroes/demo-rooftop.svg"],
      [INVITE_BRANDING_QN.heroStyle, "immersive"],
    ]);

    await seedInviteBranding(ctx, ACME_TENANT_ID, [
      [BRANDING_QN.title, "Acme Studios"],
      [BRANDING_QN.description, "Creative agency offsite — clean split layout."],
      [BRANDING_QN.accentColor, "#0d9488"],
      [INVITE_BRANDING_QN.heroImageUrl, "/heroes/acme-studio.svg"],
      [INVITE_BRANDING_QN.heroStyle, "split"],
    ]);
  },
} satisfies SeedMigration;



