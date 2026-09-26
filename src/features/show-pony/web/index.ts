import type { ClientFeatureDefinition } from "@cosmicdrift/kumiko-renderer-web";
import { showPonyTranslationsByLocale } from "../i18n";
import { ShowPonyUsagePanel } from "./usage-panel";

export const showPonyClient: ClientFeatureDefinition = {
  name: "showpony",
  translations: showPonyTranslationsByLocale,
  extensionSectionComponents: { ShowPonyUsagePanel },
};
