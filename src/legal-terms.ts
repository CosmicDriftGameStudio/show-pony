import { renderMarkdownToHtml } from "@cosmicdrift/kumiko-bundled-features/legal-pages";
import { cachedSecurePageResponse } from "@cosmicdrift/kumiko-bundled-features/page-render";
import { TemplateResolverQueries } from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import type {
  AnonymousExtraRouteDeps,
  ExtraRouteDefinition,
} from "@cosmicdrift/kumiko-framework/api";
import { computeRevisionEtag } from "@cosmicdrift/kumiko-framework/api";
import { SYSTEM_TENANT_ID } from "@cosmicdrift/kumiko-framework/engine";
import type { Context } from "hono";
import { renderLegalLayout } from "./legal-layout";

const TERMS_ROUTES = [
  { path: "/legal/nutzungsbedingungen", lang: "de", titleFallback: "Nutzungsbedingungen" },
  { path: "/legal/terms", lang: "en", titleFallback: "Terms of Service" },
] as const;

// by-slug pins kind to text-block itself (see template-resolver's
// by-slug.query.ts), so it returns the same shape findExact used to build
// from a raw row — title/content/updatedAt are all we need here.
type TermsBlock = {
  readonly title: string | null;
  readonly content: string;
  readonly updatedAt: Date;
} | null;

export function buildTermsRoutes(): readonly ExtraRouteDefinition[] {
  return TERMS_ROUTES.map(
    (route): ExtraRouteDefinition => ({
      method: "GET",
      path: route.path,
      entry: "anonymous",
      handler: async (c: Context, deps: AnonymousExtraRouteDeps) => {
        const block = (await deps.systemQuery(
          TemplateResolverQueries.bySlug,
          { slug: "terms", locale: route.lang },
          SYSTEM_TENANT_ID,
        )) as TermsBlock;
        if (!block?.content) return c.notFound();

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
          bodyHtml: renderMarkdownToHtml(block.content),
          lang: route.lang,
        });
        return cachedSecurePageResponse(c.req.raw, {
          body: html,
          etag,
          cache: { kind: "revalidate" },
          extra: pageHeaders,
        });
      },
    }),
  );
}
