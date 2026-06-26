// show-pony — ClientFeatureDefinition. Pure schema-driven, keine custom
// Components: die Screens rendert das Framework über Standard-RenderList /
// RenderEdit. Hier kommen nur die i18n-Texte rein.

import type { ClientFeatureDefinition } from "@cosmicdrift/kumiko-renderer-web";
import { showPonyTranslations } from "./i18n";

export const showPonyClient: ClientFeatureDefinition = {
  name: "showpony",
  translations: showPonyTranslations,
};
