import type { ClientFeatureDefinition } from "@cosmicdrift/kumiko-renderer-web";
import { showPonyTranslationsByLocale } from "../i18n";
import { BillingScreen } from "./billing";

export const showPonyClient: ClientFeatureDefinition = {
  name: "showpony",
  translations: showPonyTranslationsByLocale,
  components: {
    billing: BillingScreen,
  },
};
