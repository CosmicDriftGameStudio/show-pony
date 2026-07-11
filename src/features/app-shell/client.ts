// Client i18n for app-shell — server r.translations() never reaches the browser.

import type { ClientFeatureDefinition } from "@cosmicdrift/kumiko-renderer-web";

export const appShellTranslationsByLocale = {
  de: {
    "app-shell:workspace.host": "Events",
    "app-shell:workspace.platform": "Plattform",
    "app-shell:nav.users": "Nutzer",
    "tenant:nav.members": "Team",
  },
  en: {
    "app-shell:workspace.host": "Events",
    "app-shell:workspace.platform": "Platform",
    "app-shell:nav.users": "Users",
    "tenant:nav.members": "Team",
  },
} as const;

export const appShellClient: ClientFeatureDefinition = {
  name: "app-shell",
  translations: appShellTranslationsByLocale,
};
