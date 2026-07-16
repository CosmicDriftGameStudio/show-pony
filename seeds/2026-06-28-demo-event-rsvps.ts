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
//
// RUNTIME: seeds/ is copied into the Docker image WITHOUT src/ and WITHOUT
// @cosmicdrift/* in node_modules — only type-only framework imports + inline QNs.

import type { SeedMigration } from "@cosmicdrift/kumiko-framework/es-ops";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import {
  ACME_TENANT_ID,
  DEMO_EVENT_ID,
  DEMO_TENANT_ID,
  findEventBySlug,
  toRawSqlRunner,
} from "./_demo-event-db";

const INVITE_HERO_IMAGE_URL = "showpony:config:invite-hero-image-url";
const INVITE_HERO_STYLE = "showpony:config:invite-hero-style";
const BRANDING_TITLE = "managed-pages:config:branding-title";
const BRANDING_DESCRIPTION = "managed-pages:config:branding-description";
const BRANDING_ACCENT_COLOR = "managed-pages:config:branding-accent-color";

function seedWarn(label: string, err: unknown): void {
  console.warn(`show-pony seed: ${label} skipped — ${err instanceof Error ? err.message : String(err)}`);
}

async function seedInviteBranding(
  ctx: Parameters<SeedMigration["run"]>[0],
  tenantId: TenantId,
  entries: ReadonlyArray<readonly [string, string]>,
): Promise<void> {
  for (const [key, value] of entries) {
    try {
      await ctx.systemWriteAs("config:write:set", { key, value }, tenantId);
    } catch (err) {
      seedWarn(`branding ${key}`, err);
    }
  }
}

const ROOFTOP_DESC = `✨ You're on the list for something special.

Join us on the 24th floor — cocktails, live DJ, and the Show Pony 2.0 launch at midnight 🎉

Dress code: rooftop-ready 👠
Bring someone you'd proudly introduce to the team 💜`;

const ACME_DESC = `🎨 Team offsite season is here!

Workshops in the morning, pizza on the studio floor, and zero mandatory fun runs 😅

RSVP so we know how many chairs (and how much coffee) to order ☕️`;

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
      try {
        await ctx.systemWriteAs(
          "showpony:write:event:update",
          {
            id: rooftop.id,
            version: rooftop.version,
            changes: { description: ROOFTOP_DESC },
          },
          DEMO_TENANT_ID,
        );
      } catch (err) {
        seedWarn("rooftop description patch", err);
      }
    } else {
      await ctx.systemWriteAs(
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
      // systemWriteAs throws on failure (see context.ts) — event is guaranteed created here.
      rooftop = await findEventBySlug(raw, DEMO_TENANT_ID, "rooftop-launch");
    }

    const warmup = await findEventBySlug(raw, DEMO_TENANT_ID, "warmup-drinks");
    if (!warmup) {
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
        seedWarn("warmup event", err);
      }
    }

    const eventId = rooftop?.id ?? DEMO_EVENT_ID;

    for (const guest of GUESTS) {
      try {
        await ctx.systemWriteAs(
          "showpony:write:rsvp:submit",
          { eventId, ...guest },
          DEMO_TENANT_ID,
        );
      } catch (err) {
        seedWarn(`rsvp:submit for ${guest.name}`, err);
      }
    }

    const acme = await findEventBySlug(raw, ACME_TENANT_ID, "acme-offsite");
    if (acme) {
      try {
        await ctx.systemWriteAs(
          "showpony:write:event:update",
          {
            id: acme.id,
            version: acme.version,
            changes: { description: ACME_DESC },
          },
          ACME_TENANT_ID,
        );
      } catch (err) {
        seedWarn("acme description patch", err);
      }
    } else {
      try {
        await ctx.systemWriteAs(
          "showpony:write:event:create",
          {
            title: "Acme Offsite RSVP",
            slug: "acme-offsite",
            startsAt: "2026-10-03T18:00:00.000Z",
            location: "Acme HQ — Studio floor",
            description: ACME_DESC,
            guestLimit: 60,
          },
          ACME_TENANT_ID,
        );
      } catch (err) {
        seedWarn("acme event", err);
      }
    }

    await seedInviteBranding(ctx, DEMO_TENANT_ID, [
      [BRANDING_TITLE, "Mira Events"],
      [BRANDING_DESCRIPTION, "✨ Rooftop invites with sparkle ✨"],
      [BRANDING_ACCENT_COLOR, "#7c3aed"],
      [INVITE_HERO_IMAGE_URL, "/heroes/demo-rooftop.webp"],
      [INVITE_HERO_STYLE, "immersive"],
    ]);

    await seedInviteBranding(ctx, ACME_TENANT_ID, [
      [BRANDING_TITLE, "Acme Studios"],
      [BRANDING_DESCRIPTION, "Clean design. Loud ideas. 🎨"],
      [BRANDING_ACCENT_COLOR, "#0d9488"],
      [INVITE_HERO_IMAGE_URL, "/heroes/acme-studio.webp"],
      [INVITE_HERO_STYLE, "split"],
    ]);
  },
} satisfies SeedMigration;
