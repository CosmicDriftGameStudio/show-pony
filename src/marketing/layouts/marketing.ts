import {
  type ApexPage,
  type ApexPricingTier,
  type ApexSection,
  renderApexPage,
} from "@cosmicdrift/kumiko-headless/apex";
import { LOGIN_PATH } from "../../auth-paths";
import { LOGO_HERO, LOGO_ICON, LOGO_PONY } from "../../brand-mark";
import { gridFeatures } from "../features-catalog";
import { type ShowPonyTier, TIER_MAX_EVENTS, TIER_MAX_GUESTS, TIER_MONTHLY_EUR } from "../pricing";
import {
  apexFooter,
  apexHeader,
  homeUrl,
  LANG_STRINGS,
  type Lang,
  LOCALE_MAP,
  pricingPath,
  SITE_NAME,
  TOKENS_CSS,
  TWITTER_SITE,
} from "./shared";

export type RenderMarketingLayoutOptions = {
  readonly canonicalUrl?: string;
};

type TierKey = ShowPonyTier;

const TIER_KEYS: readonly TierKey[] = ["free", "starter", "pro", "studio"];

const COPY: Record<
  Lang,
  {
    meta: { title: string; description: string };
    hero: { title: string; tagline: string; metaHtml: string };
    features: { eyebrow: string; heading: string; sub: string };
    pricing: {
      eyebrow: string;
      heading: string;
      sub: string;
      perMonth: string;
      onRequest: string;
      unlimited: string;
      popularBadge: string;
      eventsSuffix: string;
      guestsSuffix: string;
    };
    tiers: Record<TierKey, { name: string; tagline: string; cta: string }>;
    trust: { heading: string; items: readonly { title: string; desc: string }[] };
    final: { heading: string; sub: string };
  }
> = {
  de: {
    meta: {
      title: "Show Pony — RSVP & Gästelisten",
      description:
        "Events planen, Einladungslinks teilen und RSVPs sammeln — Kumiko-Sample-App mit Multi-Tenant-Subdomains.",
    },
    hero: {
      title: "Dein Event. Dein Link. Deine Gästeliste.",
      tagline:
        "Show Pony ist die RSVP-Sample-App im Kumiko-Ökosystem — Host-Login auf dem Apex, schöne Invite-Seiten auf Tenant-Subdomains.",
      metaHtml:
        "<strong>Live-Demo auf show-pony.kumiko.rocks</strong><br />Cloud-Instanz ist read-only — Credentials stehen auf dem Login-Screen.",
    },
    features: {
      eyebrow: "Funktionen",
      heading: "Vom Event bis zur Gästeliste",
      sub: "Alles was du für kleine und mittlere Events brauchst — ohne Tabellen-Chaos.",
    },
    pricing: {
      eyebrow: "Preise",
      heading: "Pläne für wachsende Hosts",
      sub: "Starter und Pro sind per Stripe buchbar — Studio auf Anfrage.",
      perMonth: "/Monat",
      onRequest: "auf Anfrage",
      unlimited: "unbegrenzt",
      popularBadge: "Beliebt",
      eventsSuffix: "Events",
      guestsSuffix: "Gäste gesamt",
    },
    tiers: {
      free: { name: "Free", tagline: "Ein Event zum Ausprobieren", cta: "Demo öffnen" },
      starter: { name: "Starter", tagline: "Für regelmäßige Meetups", cta: "Starter wählen" },
      pro: { name: "Pro", tagline: "Teams & Agenturen", cta: "Pro wählen" },
      studio: { name: "Studio", tagline: "White-Label & SLA", cta: "Kontakt" },
    },
    trust: {
      heading: "Gebaut auf Kumiko",
      items: [
        {
          title: "Multi-Tenant Routing",
          desc: "Subdomain = Tenant. Gäste schreiben anonym, aber immer in den richtigen Tenant.",
        },
        {
          title: "Tutorial-first",
          desc: "Jede Oberfläche ist in docs.kumiko.rocks dokumentiert — inkl. Screenshots & Playwright-Loops.",
        },
        {
          title: "Legal & Marketing",
          desc: "Impressum, Datenschutz und AGB folgen dem Money-Horse-Pattern — zentral kompiliert, beim Boot geseedet.",
        },
      ],
    },
    final: {
      heading: "Live-Demo ansehen",
      sub: "Login auf dem Apex — Rooftop-Invite auf demo.show-pony.kumiko.rocks.",
    },
  },
  en: {
    meta: {
      title: "Show Pony — RSVP & guest lists",
      description:
        "Plan events, share invite links and collect RSVPs — Kumiko sample app with multi-tenant subdomains.",
    },
    hero: {
      title: "Your event. Your link. Your guest list.",
      tagline:
        "Show Pony is the RSVP sample app in the Kumiko ecosystem — host login on the apex, polished invites on tenant subdomains.",
      metaHtml:
        "<strong>Live demo at show-pony.kumiko.rocks</strong><br />Cloud instance is read-only — credentials appear on the login screen.",
    },
    features: {
      eyebrow: "Features",
      heading: "From event to guest list",
      sub: "Everything you need for small and mid-size events — without spreadsheet chaos.",
    },
    pricing: {
      eyebrow: "Pricing",
      heading: "Plans for growing hosts",
      sub: "Starter and Pro checkout via Stripe — Studio is sales-assisted.",
      perMonth: "/month",
      onRequest: "on request",
      unlimited: "unlimited",
      popularBadge: "Popular",
      eventsSuffix: "events",
      guestsSuffix: "guests total",
    },
    tiers: {
      free: { name: "Free", tagline: "One event to try", cta: "Open demo" },
      starter: { name: "Starter", tagline: "For regular meetups", cta: "Choose Starter" },
      pro: { name: "Pro", tagline: "Teams & agencies", cta: "Choose Pro" },
      studio: { name: "Studio", tagline: "White-label & SLA", cta: "Contact" },
    },
    trust: {
      heading: "Built on Kumiko",
      items: [
        {
          title: "Multi-tenant routing",
          desc: "Subdomain = tenant. Guests write anonymously, always into the correct tenant.",
        },
        {
          title: "Tutorial-first",
          desc: "Every surface is documented on docs.kumiko.rocks — including screenshots & Playwright loops.",
        },
        {
          title: "Legal & marketing",
          desc: "Imprint, privacy and terms follow the Money-Horse pattern — centrally compiled, seeded at boot.",
        },
      ],
    },
    final: {
      heading: "See the live demo",
      sub: "Login on the apex — rooftop invite at demo.show-pony.kumiko.rocks.",
    },
  },
};

function formatCap(n: number | null, unlimited: string, lang: Lang): string {
  if (n === null) return unlimited;
  return n.toLocaleString(lang === "de" ? "de-DE" : "en-GB");
}

function toApexTier(key: TierKey, lang: Lang): ApexPricingTier {
  const c = COPY[lang];
  const tier = c.tiers[key];
  const pricing = c.pricing;
  let amount: string;
  let perMonth = false;
  if (key === "free") {
    amount = lang === "de" ? "0 €" : "€0";
  } else if (key === "studio") {
    amount = pricing.onRequest;
  } else {
    amount = lang === "de" ? `${TIER_MONTHLY_EUR[key].toFixed(0)} €` : `€${TIER_MONTHLY_EUR[key]}`;
    perMonth = true;
  }
  const events = formatCap(TIER_MAX_EVENTS[key], pricing.unlimited, lang);
  const guests = formatCap(TIER_MAX_GUESTS[key], pricing.unlimited, lang);
  return {
    name: tier.name,
    tagline: tier.tagline,
    amount,
    priceSuffix: perMonth ? pricing.perMonth : undefined,
    featured: key === "starter",
    badge: key === "starter" ? pricing.popularBadge : undefined,
    capLine: `${events} ${pricing.eventsSuffix} · ${guests} ${pricing.guestsSuffix}`,
    benefits: [],
    cta: {
      label: tier.cta,
      href: key === "studio" ? "mailto:hello@kumiko.rocks" : LOGIN_PATH,
    },
  };
}

export function renderMarketingLayout(lang: Lang, opts: RenderMarketingLayoutOptions = {}): string {
  const origin = opts.canonicalUrl?.replace(/\/[^/]*$/, "") ?? "https://show-pony.kumiko.rocks";
  const canonicalUrl = opts.canonicalUrl ?? `${origin}${homeUrl(lang)}`;
  const c = COPY[lang];
  const s = LANG_STRINGS[lang];

  const sections: readonly ApexSection[] = [
    {
      kind: "hero",
      logo: { src: LOGO_HERO, alt: SITE_NAME, width: 88, height: 88 },
      title: c.hero.title,
      tagline: c.hero.tagline,
      ctas: [
        { label: s.cta, href: LOGIN_PATH },
        { label: s.login, href: LOGIN_PATH, variant: "secondary" },
        {
          label: lang === "de" ? "Tutorial" : "Tutorial",
          href: "https://docs.kumiko.rocks/en/show-pony/",
          variant: "secondary",
        },
      ],
      metaHtml: c.hero.metaHtml,
      screenshot: {
        src: "/screenshots/events-dashboard.png",
        alt: "Show Pony events dashboard",
        width: 1280,
        height: 800,
      },
    },
    {
      kind: "feature-grid",
      id: "features",
      eyebrow: c.features.eyebrow,
      heading: c.features.heading,
      sub: c.features.sub,
      items: gridFeatures(lang),
    },
    {
      kind: "pricing-grid",
      id: "pricing",
      eyebrow: c.pricing.eyebrow,
      heading: c.pricing.heading,
      sub: c.pricing.sub,
      tiers: TIER_KEYS.map((key) => toApexTier(key, lang)),
    },
    {
      kind: "info-grid",
      heading: c.trust.heading,
      items: c.trust.items.map((t) => ({ title: t.title, desc: t.desc })),
    },
    {
      kind: "final-cta",
      image: { src: LOGO_PONY, alt: "", width: 96, height: 96 },
      heading: c.final.heading,
      sub: c.final.sub,
      cta: { label: s.cta, href: LOGIN_PATH },
    },
  ];

  const page: ApexPage = {
    theme: "dark",
    brand: { tokensCss: TOKENS_CSS },
    head: {
      lang,
      title: c.meta.title,
      description: c.meta.description,
      canonicalUrl,
      faviconHref: LOGO_ICON,
      ogImage: `${origin}${LOGO_HERO}`,
      robots: "index, follow",
      siteName: SITE_NAME,
      locale: LOCALE_MAP[lang],
      twitterSite: TWITTER_SITE,
    },
    header: apexHeader(lang, { pathname: homeUrl(lang) }),
    sections,
    footer: apexFooter(lang),
  };

  return renderApexPage(page);
}

export function renderPricingPage(lang: Lang, opts: RenderMarketingLayoutOptions = {}): string {
  const origin = opts.canonicalUrl?.replace(/\/[^/]*$/, "") ?? "https://show-pony.kumiko.rocks";
  const c = COPY[lang];
  const s = LANG_STRINGS[lang];
  const sections: readonly ApexSection[] = [
    {
      kind: "hero",
      logo: { src: LOGO_HERO, alt: SITE_NAME, width: 72, height: 72 },
      title: c.pricing.heading,
      tagline: c.pricing.sub,
      ctas: [{ label: s.cta, href: LOGIN_PATH }],
    },
    {
      kind: "pricing-grid",
      id: "pricing",
      eyebrow: c.pricing.eyebrow,
      heading: c.pricing.heading,
      sub: c.pricing.sub,
      tiers: TIER_KEYS.map((key) => toApexTier(key, lang)),
    },
    {
      kind: "final-cta",
      image: { src: LOGO_PONY, alt: "", width: 96, height: 96 },
      heading: c.final.heading,
      sub: c.final.sub,
      cta: { label: s.cta, href: LOGIN_PATH },
    },
  ];
  const page: ApexPage = {
    theme: "dark",
    brand: { tokensCss: TOKENS_CSS },
    head: {
      lang,
      title: `${c.pricing.heading} — ${SITE_NAME}`,
      description: c.pricing.sub,
      canonicalUrl: `${origin}${pricingPath(lang)}`,
      faviconHref: LOGO_ICON,
      robots: "index, follow",
      siteName: SITE_NAME,
      locale: LOCALE_MAP[lang],
    },
    header: apexHeader(lang, { pathname: pricingPath(lang) }),
    sections,
    footer: apexFooter(lang),
  };
  return renderApexPage(page);
}
