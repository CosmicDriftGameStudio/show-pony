import { useTranslation } from "@cosmicdrift/kumiko-renderer";
import type { ReactElement } from "react";
import type { InviteBranding } from "../features/show-pony/invite-branding.shared";

type InviteHeroProps = {
  readonly branding: InviteBranding;
  readonly title: string;
  readonly when: string;
  readonly location: string | null;
  readonly guestLimit: number | null;
};

type CssVarStyle = Record<string, string>;

function brandingThemeStyle(accent: string): CssVarStyle | undefined {
  if (!accent) return undefined;
  return { "--color-primary": accent, "--color-ring": accent };
}

const HEX6_PATTERN = /^#[0-9a-fA-F]{6}$/;
const HEX8_PATTERN = /^#[0-9a-fA-F]{8}$/;

// The alpha suffixes below assume a 6-digit hex. The config field allows
// #rrggbbaa (8-digit, already has alpha), which would otherwise grow into
// an invalid 10-digit color — strip any existing alpha channel first.
function normalizedTint(accent: string): string {
  if (HEX6_PATTERN.test(accent)) return accent;
  if (HEX8_PATTERN.test(accent)) return accent.slice(0, 7);
  return "#7c3aed";
}

function heroOverlayStyle(accent: string): CssVarStyle {
  const tint = normalizedTint(accent);
  return {
    background: `linear-gradient(135deg, ${tint}99 0%, ${tint}55 45%, ${tint}22 100%)`,
  };
}

function MetaPill({
  icon,
  children,
  variant,
}: {
  icon: string;
  children: string;
  variant: "hero" | "card";
}): ReactElement {
  const surface =
    variant === "hero"
      ? "bg-[var(--color-primary-foreground)]/15 backdrop-blur-sm"
      : "bg-[var(--color-muted)]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${surface}`}>
      <span aria-hidden>{icon}</span>
      {children}
    </span>
  );
}

function MetaPills({
  when,
  location,
  guestLimit,
  variant,
}: {
  when: string;
  location: string | null;
  guestLimit: number | null;
  variant: "hero" | "card";
}): ReactElement {
  const t = useTranslation();
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <MetaPill icon="📅" variant={variant}>
        {when}
      </MetaPill>
      {location ? (
        <MetaPill icon="📍" variant={variant}>
          {location}
        </MetaPill>
      ) : null}
      {guestLimit != null && guestLimit > 0 ? (
        <MetaPill icon="👥" variant={variant}>
          {t("showpony:public.event.guest-limit", { limit: String(guestLimit) })}
        </MetaPill>
      ) : null}
    </div>
  );
}

function HeroCopy({
  branding,
  title,
  when,
  location,
  guestLimit,
  className,
  metaVariant,
}: InviteHeroProps & {
  readonly className?: string;
  readonly metaVariant: "hero" | "card";
}): ReactElement {
  const t = useTranslation();
  return (
    <div className={className}>
      {branding.logoUrl ? (
        <img src={branding.logoUrl} alt="" className="mb-4 h-10 w-auto object-contain" />
      ) : branding.title ? (
        <p className="text-sm font-semibold uppercase tracking-widest opacity-90">
          {branding.title}
        </p>
      ) : (
        <p className="text-sm font-medium uppercase tracking-widest opacity-90">
          {t("showpony:public.event.invited")}
        </p>
      )}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {branding.description ? (
        <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-90">{branding.description}</p>
      ) : null}
      <MetaPills when={when} location={location} guestLimit={guestLimit} variant={metaVariant} />
    </div>
  );
}

function HeroImage({
  url,
  alt,
  focus = "center",
}: {
  url: string;
  alt: string;
  focus?: "center" | "bottom" | "right";
}): ReactElement {
  const focusClass =
    focus === "bottom" ? "sp-hero-focus-bottom" : focus === "right" ? "sp-hero-focus-right" : "";
  return (
    <div className="sp-hero-media absolute inset-0">
      <img
        src={url}
        alt={alt}
        className={`sp-hero-ken-burns h-full w-full object-cover ${focusClass}`}
      />
    </div>
  );
}

function ImmersiveHeroBackdrop({
  heroUrl,
  accent,
  themeStyle,
}: {
  heroUrl: string;
  accent: string;
  themeStyle: CssVarStyle | undefined;
}): ReactElement {
  if (heroUrl) {
    return (
      <>
        <HeroImage url={heroUrl} alt="" focus="bottom" />
        {/* kumiko-lint-ignore no-inline-styles tenant hero gradient from branding config */}
        <div className="sp-hero-grain absolute inset-0" style={heroOverlayStyle(accent)} />
      </>
    );
  }
  // kumiko-lint-ignore no-inline-styles tenant accent fallback when no hero image
  return <div className="absolute inset-0 bg-[var(--color-primary)]" style={themeStyle} />;
}

export function InviteHero(props: InviteHeroProps): ReactElement {
  const { branding } = props;
  const themeStyle = brandingThemeStyle(branding.accentColor);
  const heroUrl = branding.heroImageUrl;

  if (branding.heroStyle === "split") {
    return (
      // kumiko-lint-ignore no-inline-styles tenant accent color from branding config
      <header
        className="sp-hero-split border-b border-[var(--color-border)] text-[var(--color-foreground)]"
        style={themeStyle}
      >
        <div className="sp-hero-split-row">
          <div className="sp-hero-split-copy flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
            <HeroCopy {...props} metaVariant="card" />
          </div>
          {heroUrl ? (
            <div className="sp-hero-split-media relative overflow-hidden">
              <HeroImage url={heroUrl} alt="" focus="right" />
            </div>
          ) : (
            <div className="sp-hero-split-media bg-[var(--color-primary)]/20" aria-hidden />
          )}
        </div>
      </header>
    );
  }

  return (
    // kumiko-lint-ignore no-inline-styles tenant accent color + hero overlay from branding config
    <header
      className="sp-hero-immersive relative isolate z-0 overflow-hidden px-6 py-12 text-[var(--color-primary-foreground)] sm:px-10 sm:py-14"
      style={themeStyle}
    >
      <ImmersiveHeroBackdrop
        heroUrl={heroUrl}
        accent={branding.accentColor}
        themeStyle={themeStyle}
      />
      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-3xl flex-col justify-end pb-2">
        <HeroCopy {...props} metaVariant="hero" />
      </div>
    </header>
  );
}

export function inviteBrandingCssVars(branding: InviteBranding): CssVarStyle | undefined {
  return brandingThemeStyle(branding.accentColor);
}
