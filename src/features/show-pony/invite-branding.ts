import {
  access,
  type ConfigKeyDefinition,
  createTenantConfig,
} from "@cosmicdrift/kumiko-framework/engine";

// Relative `/heroes/...` for seeded demo assets; https for production CDN.
const HERO_IMAGE_PATTERN = {
  regex: "^$|^/(?:[a-zA-Z0-9/_-]+\\.(?:png|webp|svg|jpe?g))$|^https://[^\\s\"'<>]{1,2000}$",
} as const;

export const HERO_STYLES = ["immersive", "split"] as const;
export type HeroStyle = (typeof HERO_STYLES)[number];

const INVITE_WRITE = access.withSystem(access.admin);

export const INVITE_BRANDING_KEYS = {
  inviteHeroImageUrl: createTenantConfig("text", {
    default: "",
    pattern: HERO_IMAGE_PATTERN,
    write: INVITE_WRITE,
  }),
  inviteHeroStyle: createTenantConfig("select", {
    default: "immersive",
    options: HERO_STYLES,
    write: INVITE_WRITE,
  }),
} satisfies Record<string, ConfigKeyDefinition>;

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
