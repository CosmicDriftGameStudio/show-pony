import { useTranslation } from "@cosmicdrift/kumiko-renderer";
import type { ReactElement } from "react";
import type { InviteBranding } from "../features/show-pony/invite-branding";

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

function heroOverlayStyle(accent: string): CssVarStyle {
  const tint = accent || "#7c3aed";
  return {
    background: `linear-gradient(135deg, ${tint}dd 0%, ${tint}99 45%, ${tint}44 100%)`,
  };
}

function MetaPills({
  when,
  location,
  guestLimit,
}: {
  when: string;
  location: string | null;
  guestLimit: number | null;
}): ReactElement {
  const t = useTranslation();
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <span className="rounded-full bg-[var(--color-primary-foreground)]/15 px-3 py-1 text-sm backdrop-blur-sm">
        {when}
      </span>
      {location ? (
        <span className="rounded-full bg-[var(--color-primary-foreground)]/15 px-3 py-1 text-sm backdrop-blur-sm">
          {location}
        </span>
      ) : null}
      {guestLimit != null && guestLimit > 0 ? (
        <span className="rounded-full bg-[var(--color-primary-foreground)]/15 px-3 py-1 text-sm backdrop-blur-sm">
          {t("showpony:public.event.guest-limit", { limit: String(guestLimit) })}
        </span>
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
}: InviteHeroProps & { readonly className?: string }): ReactElement {
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
      <MetaPills when={when} location={location} guestLimit={guestLimit} />
    </div>
  );
}

function HeroImage({ url, alt }: { url: string; alt: string }): ReactElement {
  return <img src={url} alt={alt} className="h-full w-full object-cover" />;
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
        <img src={heroUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* kumiko-lint-ignore no-inline-styles tenant hero gradient from branding config */}
        <div className="absolute inset-0" style={heroOverlayStyle(accent)} />
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
        className="border-b border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)]"
        style={themeStyle}
      >
        <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:py-16">
            <HeroCopy {...props} />
          </div>
          {heroUrl ? (
            <div className="relative min-h-[220px] lg:min-h-[360px]">
              <HeroImage url={heroUrl} alt="" />
            </div>
          ) : (
            <div
              className="min-h-[220px] bg-[var(--color-primary)]/20 lg:min-h-[360px]"
              aria-hidden
            />
          )}
        </div>
      </header>
    );
  }

  return (
    // kumiko-lint-ignore no-inline-styles tenant accent color + hero overlay from branding config
    <header
      className="relative overflow-hidden px-6 py-14 text-[var(--color-primary-foreground)] sm:px-10 sm:py-16"
      style={themeStyle}
    >
      <ImmersiveHeroBackdrop
        heroUrl={heroUrl}
        accent={branding.accentColor}
        themeStyle={themeStyle}
      />
      <div className="relative z-10 mx-auto max-w-3xl">
        <HeroCopy {...props} />
      </div>
    </header>
  );
}

export function inviteBrandingCssVars(branding: InviteBranding): CssVarStyle | undefined {
  return brandingThemeStyle(branding.accentColor);
}
