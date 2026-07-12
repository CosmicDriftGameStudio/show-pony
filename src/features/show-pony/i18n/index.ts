import {
  type TranslationsByLocale,
  translationsByLocaleFromKeys,
} from "@cosmicdrift/kumiko-renderer";
import { showPonyTranslations } from "./keys";

export { showPonyTranslations };

export const showPonyTranslationsByLocale: TranslationsByLocale =
  translationsByLocaleFromKeys(showPonyTranslations);
