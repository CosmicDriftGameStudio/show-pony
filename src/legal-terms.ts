import { renderMarkdownToHtml } from "@cosmicdrift/kumiko-bundled-features/legal-pages";
import { cachedSecurePageResponse } from "@cosmicdrift/kumiko-bundled-features/page-render";
import type { TextContentApi } from "@cosmicdrift/kumiko-bundled-features/text-content";
import { computeRevisionEtag } from "@cosmicdrift/kumiko-framework/api";
import { SYSTEM_TENANT_ID } from "@cosmicdrift/kumiko-framework/engine";
import type { Hono } from "hono";
import { renderLegalLayout } from "./legal-layout";

const TERMS_ROUTES = [
  { path: "/legal/nutzungsbedingungen", lang: "de", titleFallback: "Nutzungsbedingungen" },
  { path: "/legal/terms", lang: "en", titleFallback: "Terms of Service" },
] as const;

export function wireTermsRoutes(app: Hono, textContent: TextContentApi): void {
  for (const route of TERMS_ROUTES) {
    app.get(route.path, async (c) => {
      const block = await textContent.getBlock({
        tenantId: SYSTEM_TENANT_ID,
        slug: "terms",
        lang: route.lang,
      });
      if (!block?.body) return c.notFound();

      const etag = computeRevisionEtag([
        SYSTEM_TENANT_ID,
        "terms",
        route.lang,
        String(block.updatedAt),
      ]);
      const pageHeaders = { "content-type": "text/html; charset=utf-8" } as const;
      const notModified = cachedSecurePageResponse(c.req.raw, {
        body: null,
        etag,
        cache: { kind: "revalidate" },
        extra: pageHeaders,
      });
      if (notModified.status === 304) return notModified;

      const html = renderLegalLayout({
        title: block.title || route.titleFallback,
        bodyHtml: renderMarkdownToHtml(block.body),
        lang: route.lang,
      });
      return cachedSecurePageResponse(c.req.raw, {
        body: html,
        etag,
        cache: { kind: "revalidate" },
        extra: pageHeaders,
      });
    });
  }
}
