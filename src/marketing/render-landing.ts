import { writeStaticHtmlPages } from "@cosmicdrift/kumiko-server-runtime";
import { renderFeaturesPage } from "./layouts/features-page";
import { renderMarketingLayout, renderPricingPage } from "./layouts/marketing";
import { homeUrl, type Lang, pricingPath } from "./layouts/shared";

const LANGS: readonly Lang[] = ["de", "en"];

export async function renderAllMarketingPages(canonicalOrigin: string): Promise<void> {
  await writeStaticHtmlPages(
    "dist/pages",
    LANGS.flatMap((lang) => [
      {
        path: lang,
        html: renderMarketingLayout(lang, { canonicalUrl: `${canonicalOrigin}${homeUrl(lang)}` }),
      },
      { path: `${lang}/features`, html: renderFeaturesPage(lang, { canonicalOrigin }) },
      {
        path: `${lang}/pricing`,
        html: renderPricingPage(lang, { canonicalUrl: `${canonicalOrigin}${pricingPath(lang)}` }),
      },
    ]),
  );
}
