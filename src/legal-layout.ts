import { escapeHtml } from "@cosmicdrift/kumiko-headless";
import { type Lang, renderFooter, renderHeader, SHARED_CSS } from "./marketing/layouts/shared";

type RenderLegalLayoutOptions = {
  readonly title: string;
  readonly bodyHtml: string;
  readonly lang: string;
};

const PROSE_CSS = `
  main { padding: 3.5rem 0 4rem; }
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

export function renderLegalLayout(opts: RenderLegalLayoutOptions): string {
  const lang: Lang = opts.lang === "en" ? "en" : "de";
  const headerHtml = renderHeader(lang);
  const footerHtml = renderFooter(lang);
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(opts.title)} · Show Pony</title>
    <meta name="robots" content="index,follow" />
    <style>${SHARED_CSS}${PROSE_CSS}</style>
  </head>
  <body>
    ${headerHtml}
    <main>
      <div class="container-narrow prose">
        ${opts.bodyHtml}
      </div>
    </main>
    ${footerHtml}
  </body>
</html>`;
}
