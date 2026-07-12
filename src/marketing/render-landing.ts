import { mkdir, writeFile } from "node:fs/promises";
import { renderFeaturesPage } from "./layouts/features-page";
import { renderMarketingLayout, renderPricingPage } from "./layouts/marketing";
import { homeUrl, type Lang, pricingPath } from "./layouts/shared";

const LANGS: readonly Lang[] = ["de", "en"];

export async function renderLandingToFile(
  canonicalOrigin = "https://show-pony.kumiko.rocks",
): Promise<void> {
  for (const lang of LANGS) {
    const html = renderMarketingLayout(lang, {
      canonicalUrl: `${canonicalOrigin}${homeUrl(lang)}`,
    });
    await mkdir(`dist/pages/${lang}`, { recursive: true });
    await writeFile(`dist/pages/${lang}/index.html`, html, "utf-8");
  }
}

export async function renderFeaturesToFile(
  canonicalOrigin = "https://show-pony.kumiko.rocks",
): Promise<void> {
  for (const lang of LANGS) {
    const html = renderFeaturesPage(lang, { canonicalOrigin });
    await mkdir(`dist/pages/${lang}/features`, { recursive: true });
    await writeFile(`dist/pages/${lang}/features/index.html`, html, "utf-8");
  }
}

export async function renderPricingToFile(
  canonicalOrigin = "https://show-pony.kumiko.rocks",
): Promise<void> {
  for (const lang of LANGS) {
    const html = renderPricingPage(lang, {
      canonicalUrl: `${canonicalOrigin}${pricingPath(lang)}`,
    });
    await mkdir(`dist/pages/${lang}/pricing`, { recursive: true });
    await writeFile(`dist/pages/${lang}/pricing/index.html`, html, "utf-8");
  }
}

export async function renderAllMarketingPages(canonicalOrigin: string): Promise<void> {
  await renderLandingToFile(canonicalOrigin);
  await renderFeaturesToFile(canonicalOrigin);
  await renderPricingToFile(canonicalOrigin);
}
