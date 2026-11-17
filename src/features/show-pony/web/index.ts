import type { ClientFeatureDefinition } from "@cosmicdrift/kumiko-renderer/web";
import { showPonyTranslationsByLocale } from "../i18n";

export const showPonyClient: ClientFeatureDefinition = {
  name: "showpony",
  translations: showPonyTranslationsByLocale,
};
