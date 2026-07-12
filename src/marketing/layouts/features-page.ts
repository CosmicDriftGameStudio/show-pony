import { escapeHtml } from "@cosmicdrift/kumiko-headless";
import { type ApexPage, type ApexSection, renderApexPage } from "@cosmicdrift/kumiko-headless/apex";
import { LOGIN_PATH } from "../../auth-paths";
import { LOGO_HERO, LOGO_ICON, LOGO_PONY } from "../../brand-mark";
import { detailFeatures, tutorialLinksHtml } from "../features-catalog";
import {
  apexFooter,
  apexHeader,
  FEATURE_PAGE_CSS,
  featuresPath,
  LANG_STRINGS,
  type Lang,
  LOCALE_MAP,
  pricingPath,
  SITE_NAME,
  TOKENS_CSS,
  TWITTER_SITE,
} from "./shared";

export type RenderFeaturesPageOptions = { readonly canonicalOrigin?: string };

const COPY: Record<
  Lang,
  {
    metaTitle: string;
    metaDescription: string;
    heroTitle: string;
    heroTagline: string;
    tourHeading: string;
    tourSub: string;
    finalHeading: string;
    finalSub: string;
  }
> = {
  de: {
    metaTitle: "Funktionen — Show Pony",
    metaDescription:
      "RSVP-Flow, Subdomains und Host-Dashboard im Detail — mit Links ins Kumiko-Tutorial.",
    heroTitle: "So funktioniert Show Pony",
    heroTagline: "Vom Apex-Login bis zur öffentlichen Invite-Seite — alles aus einer Kumiko-App.",
    tourHeading: "Im Tutorial nachbauen",
    tourSub:
      "Die Docs führen Schritt für Schritt durch denselben Code, den du in der Cloud-Demo siehst.",
    finalHeading: "Demo öffnen",
    finalSub: "Host-Login auf dem Apex, Rooftop-Event auf der Demo-Subdomain.",
  },
  en: {
    metaTitle: "Features — Show Pony",
    metaDescription:
      "RSVP flow, subdomains and host dashboard in detail — with links into the Kumiko tutorial.",
    heroTitle: "How Show Pony works",
    heroTagline: "From apex login to the public invite page — all from one Kumiko app.",
    tourHeading: "Rebuild it in the tutorial",
    tourSub: "The docs walk through the same code you see in the cloud demo.",
    finalHeading: "Open the demo",
    finalSub: "Host login on the apex, rooftop event on the demo subdomain.",
  },
};

function detailBlocksHtml(lang: Lang): string {
  return detailFeatures(lang)
    .map((f, i) => {
      const reverse = i % 2 === 1 ? " reverse" : "";
      const shot =
        f.shot !== undefined
          ? `<div class="feat-shot"><img src="/screenshots/${escapeHtml(f.shot)}.png" alt="${escapeHtml(f.title)}" loading="lazy" /></div>`
          : "";
      return `<div class="feat-item${reverse}"><div><h3>${escapeHtml(f.title)}</h3><p>${escapeHtml(f.detail)}</p></div>${shot}</div>`;
    })
    .join("\n");
}

export function renderFeaturesPage(lang: Lang, opts: RenderFeaturesPageOptions = {}): string {
  const origin = opts.canonicalOrigin ?? "https://show-pony.kumiko.rocks";
  const c = COPY[lang];
  const s = LANG_STRINGS[lang];
  const other: Lang = lang === "de" ? "en" : "de";

  const sections: readonly ApexSection[] = [
    {
      kind: "hero",
      logo: { src: LOGO_HERO, alt: SITE_NAME, width: 88, height: 88 },
      title: c.heroTitle,
      tagline: c.heroTagline,
      ctas: [
        { label: s.cta, href: LOGIN_PATH },
        { label: s.navPricing, href: pricingPath(lang), variant: "secondary" },
      ],
    },
    { kind: "html", html: `<section class="container">${detailBlocksHtml(lang)}</section>` },
    {
      kind: "html",
      html: `<section class="container features"><div class="section-head"><h2>${escapeHtml(c.tourHeading)}</h2><p>${escapeHtml(c.tourSub)}</p>${tutorialLinksHtml(lang)}</div></section>`,
    },
    {
      kind: "final-cta",
      image: { src: LOGO_PONY, alt: "", width: 96, height: 96 },
      heading: c.finalHeading,
      sub: c.finalSub,
      cta: { label: s.cta, href: LOGIN_PATH },
    },
  ];

  const page: ApexPage = {
    theme: "dark",
    brand: { tokensCss: TOKENS_CSS + FEATURE_PAGE_CSS },
    head: {
      lang,
      title: c.metaTitle,
      description: c.metaDescription,
      canonicalUrl: `${origin}${featuresPath(lang)}`,
      faviconHref: LOGO_ICON,
      ogImage: `${origin}${LOGO_HERO}`,
      robots: "index, follow",
      siteName: SITE_NAME,
      locale: LOCALE_MAP[lang],
      twitterSite: TWITTER_SITE,
      alternates: [
        { hreflang: lang, href: `${origin}${featuresPath(lang)}` },
        { hreflang: other, href: `${origin}${featuresPath(other)}` },
      ],
    },
    header: apexHeader(lang, { pathname: featuresPath(lang) }),
    sections,
    footer: apexFooter(lang),
  };

  return renderApexPage(page);
}
