import { createLegalPagesLayout } from "@cosmicdrift/kumiko-bundled-features/legal-pages";
import { type Lang, renderFooter, renderHeader, SHARED_CSS } from "./shared";

// Only vertical padding on <main>: the legal layout puts container-narrow on <main> itself,
// and its horizontal padding must survive.
const PROSE_CSS = `
  main { padding-block: 3.5rem 4rem; }
  .prose h1 { font-size: 2rem; line-height: 1.15; margin: 0 0 1.5rem; letter-spacing: -0.02em; }
  .prose h2 { font-size: 1.25rem; margin: 2rem 0 0.75rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
  .prose h2:first-of-type { border-top: none; padding-top: 0; }
  .prose h3 { font-size: 1.0625rem; margin: 1.5rem 0 0.5rem; }
  .prose p, .prose ul, .prose ol { margin: 0.5rem 0; }
  .prose ul, .prose ol { padding-left: 1.5rem; }
  .prose li { padding: 0.125rem 0; color: var(--fg); }
  .prose a { color: var(--primary); }
  .prose code { background: var(--bg-muted); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875rem; }
  .prose strong { color: var(--fg); }
`;

function toLang(lang: string): Lang {
  return lang === "en" ? "en" : "de";
}

export const showPonyLegalLayout = createLegalPagesLayout({
  siteName: "Show Pony",
  css: SHARED_CSS + PROSE_CSS,
  headerHtml: (lang) => renderHeader(toLang(lang)),
  footerHtml: (lang) => renderFooter(toLang(lang)),
  contentClass: "container-narrow prose",
});
