// Client feature — schema-driven screens only; i18n bundle for the browser.

import type { ClientFeatureDefinition } from "@cosmicdrift/kumiko-renderer-web";
import { showPonyTranslationsByLocale } from "../i18n";

export const showPonyClient: ClientFeatureDefinition = {
  name: "showpony",
  translations: showPonyTranslationsByLocale,
};
