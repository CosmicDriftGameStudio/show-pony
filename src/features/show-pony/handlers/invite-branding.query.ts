import { BRANDING_QN } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import type { ConfigAccessor } from "@cosmicdrift/kumiko-framework/engine";
import { defineQueryHandler } from "@cosmicdrift/kumiko-framework/engine";
import { z } from "zod";
import {
  HERO_STYLES,
  type HeroStyle,
  INVITE_BRANDING_QN,
  type InviteBranding,
} from "../invite-branding.shared";

async function readText(config: ConfigAccessor | undefined, key: string): Promise<string> {
  if (!config) return "";
  const value = await config(key);
  return typeof value === "string" ? value : "";
}

async function readManagedBranding(config: ConfigAccessor | undefined) {
  const [title, description, accentColor, logoUrl] = await Promise.all([
    readText(config, BRANDING_QN.title),
    readText(config, BRANDING_QN.description),
    readText(config, BRANDING_QN.accentColor),
    readText(config, BRANDING_QN.logoUrl),
  ]);
  return { title, description, accentColor, logoUrl };
}

function parseHeroStyle(raw: string): HeroStyle {
  return (HERO_STYLES as readonly string[]).includes(raw) ? (raw as HeroStyle) : "immersive";
}

export function createInviteBrandingQuery() {
  return defineQueryHandler({
    name: "invite-branding",
    schema: z.object({}),
    access: { roles: ["anonymous", "User", "TenantAdmin", "Admin", "SystemAdmin"] },
    handler: async (_query, ctx): Promise<InviteBranding> => {
      const base = await readManagedBranding(ctx.config);
      const [heroImageUrl, heroStyleRaw] = await Promise.all([
        readText(ctx.config, INVITE_BRANDING_QN.heroImageUrl),
        readText(ctx.config, INVITE_BRANDING_QN.heroStyle),
      ]);
      return {
        title: base.title,
        description: base.description,
        accentColor: base.accentColor,
        logoUrl: base.logoUrl,
        heroImageUrl,
        heroStyle: parseHeroStyle(heroStyleRaw),
      };
    },
  });
}
