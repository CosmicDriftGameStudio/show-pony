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

function parseHeroStyle(raw: string): HeroStyle {
  return (HERO_STYLES as readonly string[]).includes(raw) ? (raw as HeroStyle) : "immersive";
}

export function coerceInviteBranding(value: unknown): InviteBranding {
  if (typeof value !== "object" || value === null) return EMPTY_INVITE_BRANDING;
  const source = value as Record<string, unknown>;
  const str = (key: string) => (typeof source[key] === "string" ? (source[key] as string) : "");
  return {
    title: str("title"),
    description: str("description"),
    accentColor: str("accentColor"),
    logoUrl: str("logoUrl"),
    heroImageUrl: str("heroImageUrl"),
    heroStyle: parseHeroStyle(str("heroStyle")),
  };
}
