import { escapeHtml } from "@cosmicdrift/kumiko-headless";
import {
  APEX_NAV_MENU_CSS,
  type ApexFooter,
  type ApexHeader,
  renderApexHeader,
} from "@cosmicdrift/kumiko-headless/apex";
import { LOGO_ICON } from "../../brand-mark";
import { localeRouter } from "../locale-routes";

export type Lang = "de" | "en";

export const SITE_NAME = "Show Pony";
export const TWITTER_SITE = "@kumiko_rocks";
export const LOCALE_MAP: Record<Lang, string> = { de: "de_DE", en: "en_US" };

export const TOKENS_CSS = `
  :root {
    --bg: #f8f6ff; --bg-card: #ffffff; --bg-muted: #f0edfa; --border: #ddd6fe;
    --fg: #1e1033; --fg-muted: #6b5b8a; --fg-subtle: #8b7cb0;
    --primary: #7c3aed; --primary-hover: #6d28d9; --primary-fg: #ffffff;
    --accent: #a78bfa; --accent-hover: #8b5cf6; --accent-fg: #1e1033;
    --on-dark: #f5f0ff; --on-dark-muted: rgba(245,240,255,0.75); --on-dark-border: rgba(245,240,255,0.18);
    --status-ok: #16a34a;
    --shadow: 0 20px 50px -24px rgba(76, 29, 149, 0.35);
  }
`;

const BASE_LAYOUT_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: var(--bg); color: var(--fg); line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh; display: flex; flex-direction: column;
  }
  main { flex: 1; }
  a { color: var(--primary); text-decoration: none; }
  a:hover { color: var(--primary-hover); }
  h1, h2, h3 { letter-spacing: -0.02em; }
  .container { max-width: 1120px; margin: 0 auto; padding: 0 1.5rem; width: 100%; }
  .container-narrow { max-width: 760px; margin: 0 auto; padding: 0 1.5rem; width: 100%; }
  .btn {
    display: inline-block; padding: 0.6rem 1.15rem; border-radius: 0.5rem;
    font-weight: 600; font-size: 0.9375rem; border: 1px solid transparent;
    cursor: pointer; transition: background 0.15s, border-color 0.15s, transform 0.05s;
  }
  .btn:active { transform: translateY(1px); }
  .btn-primary { background: var(--primary); color: var(--primary-fg); }
  .btn-primary:hover { background: var(--primary-hover); color: var(--primary-fg); }
  .btn-secondary { background: var(--bg-card); color: var(--fg); border-color: var(--border); }
  .btn-secondary:hover { border-color: var(--fg-muted); color: var(--fg); }
`;

const HEADER_CSS = `
  header { position: sticky; top: 0; z-index: 10; background: #1e1033;
    border-bottom: 1px solid var(--on-dark-border); }
  .nav { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.85rem 0; }
  .brand { display: flex; align-items: center; gap: 0.55rem; font-weight: 700; font-size: 1.125rem; }
  .brand a { color: var(--on-dark); display: inline-flex; align-items: center; gap: 0.55rem; }
  .brand a:hover { color: var(--on-dark); }
  .brand img { width: 1.7rem; height: 1.7rem; border-radius: 0.4rem; }
  .nav-links { display: flex; gap: 1.5rem; align-items: center; font-size: 0.9375rem; }
  .nav-links a { color: var(--on-dark-muted); }
  .nav-links a:hover { color: var(--on-dark); }
  .nav-menu__trigger { color: var(--on-dark-muted); }
  .nav-menu__trigger:hover { color: var(--on-dark); }
  .nav-actions { display: flex; gap: 0.75rem; align-items: center; font-size: 0.9375rem; }
  .nav-actions > a:not(.btn) { color: var(--on-dark-muted); }
  .nav-actions > a:not(.btn):hover { color: var(--on-dark); }
  header .btn-primary { background: var(--accent); color: var(--accent-fg); }
  header .btn-primary:hover { background: var(--accent-hover); color: var(--accent-fg); }
  @media (max-width: 640px) { .nav-links { display: none; } }
`;

const FOOTER_CSS = `
  footer { background: #1e1033; color: var(--on-dark-muted); padding: 3.5rem 0 2.5rem; font-size: 0.9rem; }
  .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 2rem; }
  .footer-brand { display: flex; align-items: center; gap: 0.55rem; font-weight: 700; color: var(--on-dark); margin-bottom: 0.75rem; }
  .footer-brand img { width: 1.6rem; height: 1.6rem; border-radius: 0.4rem; }
  .footer-tagline { color: var(--on-dark-muted); max-width: 34ch; margin: 0; }
  .footer-col h4 { font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--on-dark-muted); margin: 0 0 0.85rem; }
  .footer-col a { display: block; color: var(--on-dark-muted); margin-bottom: 0.5rem; }
  .footer-col a:hover { color: var(--on-dark); }
  .footer-bottom { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--on-dark-border);
    display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; }
  @media (max-width: 720px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr; gap: 1.75rem; } }
`;

export const SHARED_CSS =
  TOKENS_CSS + BASE_LAYOUT_CSS + APEX_NAV_MENU_CSS + HEADER_CSS + FOOTER_CSS;

export const FEATURE_PAGE_CSS = `
  .feat-item { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center;
    padding: 1.75rem 0; border-top: 1px solid var(--border); }
  .feat-item:first-of-type { border-top: 0; }
  .feat-item.reverse .feat-shot { order: -1; }
  .feat-item h3 { margin: 0 0 0.5rem; font-size: 1.3rem; }
  .feat-item p { margin: 0; color: var(--fg-muted); max-width: 52ch; }
  .feat-shot img { width: 100%; height: auto; border-radius: 0.6rem; border: 1px solid var(--border);
    box-shadow: var(--shadow); display: block; }
  @media (max-width: 720px) { .feat-item { grid-template-columns: 1fr; gap: 1rem; }
    .feat-item.reverse .feat-shot { order: 0; } }
  .tutorial-links { list-style: none; padding: 0; margin: 1rem 0 0; display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; }
  .tutorial-links a { font-weight: 600; }
`;

export const LANG_STRINGS = {
  de: {
    navFeatures: "Funktionen",
    navPricing: "Preise",
    login: "Login",
    cta: "Demo starten",
    impressum: "Impressum",
    datenschutz: "Datenschutz",
    nutzungsbedingungen: "Nutzungsbedingungen",
    madeIn: "Made in Leipzig",
    footerTagline: "Events planen, Links teilen, RSVPs sammeln — die Kumiko RSVP-Sample-App.",
    footerProduct: "Produkt",
    footerLegal: "Rechtliches",
    footerLearn: "Tutorial",
    noTracking: "Kein Tracking. Keine Drittanbieter-Cookies.",
  },
  en: {
    navFeatures: "Features",
    navPricing: "Pricing",
    login: "Login",
    cta: "Try the demo",
    impressum: "Imprint",
    datenschutz: "Privacy",
    nutzungsbedingungen: "Terms",
    madeIn: "Made in Leipzig",
    footerTagline: "Plan events, share links, collect RSVPs — the Kumiko RSVP sample app.",
    footerProduct: "Product",
    footerLegal: "Legal",
    footerLearn: "Tutorial",
    noTracking: "No tracking. No third-party cookies.",
  },
} as const;

export function homeUrl(lang: Lang): string {
  return localeRouter.publicPath("home", lang);
}

export function featuresPath(lang: Lang): string {
  return localeRouter.publicPath("features", lang);
}

export function pricingPath(lang: Lang): string {
  return localeRouter.publicPath("pricing", lang);
}

function altLangSwitchHref(pathname: string): string {
  return localeRouter.altLocalePath(pathname);
}

export function legalImprintPath(lang: Lang): string {
  return lang === "de" ? "/legal/impressum" : "/legal/imprint";
}

export function legalPrivacyPath(lang: Lang): string {
  return lang === "de" ? "/legal/datenschutz" : "/legal/privacy";
}

export function legalTermsPath(lang: Lang): string {
  return lang === "de" ? "/legal/nutzungsbedingungen" : "/legal/terms";
}

export function renderHeader(lang: Lang, opts?: { readonly pathname?: string }): string {
  return renderApexHeader(apexHeader(lang, opts));
}

export function renderFooter(lang: Lang): string {
  const s = LANG_STRINGS[lang];
  const tutorialBase = "https://docs.kumiko.rocks/en/show-pony/";
  return `<footer>
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-brand"><img src="${escapeHtml(LOGO_ICON)}" alt="" /> Show Pony</div>
        <p class="footer-tagline">${escapeHtml(s.footerTagline)}</p>
      </div>
      <div class="footer-col">
        <h4>${escapeHtml(s.footerProduct)}</h4>
        <a href="${escapeHtml(featuresPath(lang))}">${escapeHtml(s.navFeatures)}</a>
        <a href="${escapeHtml(pricingPath(lang))}">${escapeHtml(s.navPricing)}</a>
        <a href="${escapeHtml("/login")}">${escapeHtml(s.login)}</a>
        <a href="${escapeHtml(tutorialBase)}">${lang === "de" ? "Kumiko-Tutorial" : "Kumiko tutorial"}</a>
      </div>
      <div class="footer-col">
        <h4>${escapeHtml(s.footerLegal)}</h4>
        <a href="${escapeHtml(legalImprintPath(lang))}">${escapeHtml(s.impressum)}</a>
        <a href="${escapeHtml(legalPrivacyPath(lang))}">${escapeHtml(s.datenschutz)}</a>
        <a href="${escapeHtml(legalTermsPath(lang))}">${escapeHtml(s.nutzungsbedingungen)}</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; Show Pony &middot; Cosmic Drift Game Studio &middot; ${escapeHtml(s.madeIn)}</span>
      <span>${escapeHtml(s.noTracking)}</span>
    </div>
  </div>
</footer>`;
}

export function apexHeader(lang: Lang, opts?: { readonly pathname?: string }): ApexHeader {
  const s = LANG_STRINGS[lang];
  const pathname = opts?.pathname ?? homeUrl(lang);
  return {
    brand: { href: homeUrl(lang), label: SITE_NAME, logoSrc: LOGO_ICON },
    navLinks: [
      { href: featuresPath(lang), label: s.navFeatures },
      { href: pricingPath(lang), label: s.navPricing },
    ],
    actions: [
      { label: lang === "en" ? "DE" : "EN", href: altLangSwitchHref(pathname), variant: "link" },
      { label: s.login, href: "/login", variant: "link" },
      { label: s.cta, href: "/login", variant: "primary" },
    ],
  };
}

export function apexFooter(lang: Lang): ApexFooter {
  const s = LANG_STRINGS[lang];
  const tutorialBase = "https://docs.kumiko.rocks/en/show-pony/";
  return {
    brand: { label: SITE_NAME, logoSrc: LOGO_ICON },
    tagline: s.footerTagline,
    columns: [
      {
        heading: s.footerProduct,
        links: [
          { href: featuresPath(lang), label: s.navFeatures },
          { href: pricingPath(lang), label: s.navPricing },
          { href: "/login", label: s.login },
        ],
      },
      {
        heading: s.footerLegal,
        links: [
          { href: legalImprintPath(lang), label: s.impressum },
          { href: legalPrivacyPath(lang), label: s.datenschutz },
          { href: legalTermsPath(lang), label: s.nutzungsbedingungen },
        ],
      },
      {
        heading: s.footerLearn,
        links: [
          { href: tutorialBase, label: lang === "de" ? "Kumiko-Tutorial" : "Kumiko tutorial" },
        ],
      },
    ],
    bottomLeft: `© ${SITE_NAME} · Cosmic Drift Game Studio · ${s.madeIn}`,
    bottomRight: s.noTracking,
  };
}
