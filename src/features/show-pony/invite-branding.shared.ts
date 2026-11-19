import { isOneOf, isPlainObject } from "@cosmicdrift/kumiko-types/type-guards";
export const HERO_STYLES = ["immersive", "split"] as const;
export type HeroStyle = (typeof HERO_STYLES)[number];

export const INVITE_BRANDING_QN = {
  heroImageUrl: "showpony:config:invite-hero-image-url",
  heroStyle: "showpony:config:invite-hero-style",
} as const;

export const INVITE_BRANDING_QUERY_QN = "showpony:query:invite-branding";

export type InviteBranding = {
  readonly title: string;
  readonly description: string;
  readonly accentColor: string;
  readonly logoUrl: string;
  readonly heroImageUrl: string;
  readonly heroStyle: HeroStyle;
};

export const EMPTY_INVITE_BRANDING: InviteBranding = {
  title: "",
  description: "",
  accentColor: "",
  logoUrl: "",
  heroImageUrl: "",
  heroStyle: "immersive",
};

export function parseHeroStyle(raw: string): HeroStyle {
  return isOneOf(HERO_STYLES, raw) ? raw : "immersive";
}

export function coerceInviteBranding(value: unknown): InviteBranding {
  if (!isPlainObject(value)) return EMPTY_INVITE_BRANDING;
  const str = (key: string): string => {
    const field = value[key];
    return typeof field === "string" ? field : "";
  };
  return {
    title: str("title"),
    description: str("description"),
    accentColor: str("accentColor"),
    logoUrl: str("logoUrl"),
    heroImageUrl: str("heroImageUrl"),
    heroStyle: parseHeroStyle(str("heroStyle")),
  };
}
