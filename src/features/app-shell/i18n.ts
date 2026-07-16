// Single source for app-shell's translation keys — feature.ts registers
// them server-side via r.translations(), client.ts derives the browser
// bundle from the same object so the two never drift apart.
export const APP_SHELL_TRANSLATION_KEYS = {
  "app-shell:workspace.host": { de: "Events", en: "Events" },
  "app-shell:workspace.platform": { de: "Plattform", en: "Platform" },
  "app-shell:nav.users": { de: "Nutzer", en: "Users" },
  // tenant feature label is tenant:nav.members; tenantClient bundles tenant.nav.members.
  "tenant:nav.members": { de: "Team", en: "Team" },
} as const;
