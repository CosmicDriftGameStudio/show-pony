// Patch existing demo DBs: swap seeded SVG hero URLs for WebP photography.
import type { SeedMigration } from "@cosmicdrift/kumiko-framework/es-ops";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import { ACME_TENANT_ID, DEMO_TENANT_ID } from "./_demo-event-db";

const INVITE_HERO_IMAGE_URL = "showpony:config:invite-hero-image-url";

async function setHeroUrl(
  ctx: Parameters<SeedMigration["run"]>[0],
  tenantId: TenantId,
  url: string,
): Promise<void> {
  try {
    await ctx.systemWriteAs(
      "config:write:set",
      { key: INVITE_HERO_IMAGE_URL, value: url },
      tenantId,
    );
  } catch (err) {
    console.warn(
      `show-pony seed: hero webp patch skipped — ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export default {
  description: "invite hero images: SVG → WebP for demo + acme tenants",
  run: async (ctx) => {
    await setHeroUrl(ctx, DEMO_TENANT_ID, "/heroes/demo-rooftop.webp");
    await setHeroUrl(ctx, ACME_TENANT_ID, "/heroes/acme-studio.webp");
  },
} satisfies SeedMigration;
