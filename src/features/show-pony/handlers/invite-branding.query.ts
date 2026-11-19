import { BRANDING_QN } from "@cosmicdrift/kumiko-bundled-features/branding";
import {
  access,
  type ConfigAccessor,
  defineQueryHandler,
} from "@cosmicdrift/kumiko-framework/engine";
import { z } from "zod";
import { INVITE_BRANDING_QN, type InviteBranding, parseHeroStyle } from "../invite-branding.shared";

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

export const inviteBrandingQuery = defineQueryHandler({
  name: "invite-branding",
  schema: z.object({}),
  access: { roles: access.anonymous, anySignedIn: true },
  rateLimit: { per: "ip+handler", limit: 60, windowSeconds: 60 },
  description:
    "Returns the tenant's invite-page branding (title, description, accent color, logo URL, hero image URL and hero style); readable anonymously and by every signed-in caller because the public invite page renders it.",
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
