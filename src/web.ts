// show-pony — ClientFeatureDefinition. Purely schema-driven, no custom
// components: the framework renders screens via standard RenderList /
// RenderEdit. Only i18n translations are wired in here.

import type { ClientFeatureDefinition } from "@cosmicdrift/kumiko-renderer-web";
import { showPonyTranslations } from "./i18n";

export const showPonyClient: ClientFeatureDefinition = {
  name: "showpony",
  translations: showPonyTranslations,
};
