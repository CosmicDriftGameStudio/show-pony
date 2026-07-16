// Client i18n for app-shell — server r.translations() never reaches the browser.

import { translationsByLocaleFromKeys } from "@cosmicdrift/kumiko-renderer";
import type { ClientFeatureDefinition } from "@cosmicdrift/kumiko-renderer-web";
import { APP_SHELL_TRANSLATION_KEYS } from "./i18n";

export const appShellTranslationsByLocale = translationsByLocaleFromKeys(
  APP_SHELL_TRANSLATION_KEYS,
);

export const appShellClient: ClientFeatureDefinition = {
  name: "app-shell",
  translations: appShellTranslationsByLocale,
};
