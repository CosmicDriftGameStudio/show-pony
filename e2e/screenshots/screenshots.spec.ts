// Captures each scenario x theme x viewport via the template's runMatrix,
// which owns the settle wait, output layout (<dir>/<name>/<locale>/<theme>/<viewport>.png
// — the layout docs/screenshots already uses) and the identical-across-themes
// check. Two calls because four marketing/legal pages have fixed dark brand
// chrome that never reacts to .dark — they only need the light capture.
import { applyDefaultTheme, DEFAULT_THEMES, runMatrix } from "@cosmicdrift/kumiko-testing/e2e";
import { FIXED_CHROME_SCENARIOS, THEMEABLE_SCENARIOS } from "./scenarios";

runMatrix(THEMEABLE_SCENARIOS, {
  themes: DEFAULT_THEMES,
  applyTheme: applyDefaultTheme,
  locales: ["en"],
});

runMatrix(FIXED_CHROME_SCENARIOS, {
  themes: ["default-light"],
  applyTheme: applyDefaultTheme,
  locales: ["en"],
});
