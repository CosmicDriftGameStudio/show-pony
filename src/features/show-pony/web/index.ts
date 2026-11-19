import type { ClientFeatureDefinition } from "@cosmicdrift/kumiko-renderer/web";
import { showPonyTranslationsByLocale } from "../i18n";
import { ShowPonyUpgradeHint } from "./upgrade-hint-panel";

export const showPonyClient: ClientFeatureDefinition = {
  name: "showpony",
  translations: showPonyTranslationsByLocale,
  extensionSectionComponents: { ShowPonyUpgradeHint },
};
