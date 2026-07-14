import {
  access,
  type ConfigKeyDefinition,
  createTenantConfig,
} from "@cosmicdrift/kumiko-framework/engine";
import { HERO_STYLES } from "./invite-branding.shared";

export {
  coerceInviteBranding,
  EMPTY_INVITE_BRANDING,
  HERO_STYLES,
  type HeroStyle,
  INVITE_BRANDING_QN,
  INVITE_BRANDING_QUERY_QN,
  type InviteBranding,
} from "./invite-branding.shared";

// Relative `/heroes/...` for seeded demo assets; https for production CDN.
const HERO_IMAGE_PATTERN = {
  regex: "^$|^/(?:[a-zA-Z0-9/_-]+\\.(?:png|webp|svg|jpe?g))$|^https://[^\\s\"'<>]{1,2000}$",
} as const;

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
