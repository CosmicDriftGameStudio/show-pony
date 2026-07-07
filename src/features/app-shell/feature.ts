// show-pony workspaces — host tenant surface vs platform operator surface.

import {
  access,
  defineFeature,
  type FeatureDefinition,
} from "@cosmicdrift/kumiko-framework/engine";

const HOST_NAV_MEMBERS = [
  "admin-shell:nav:tenant-overview",
  "showpony:nav:events",
  "showpony:nav:event-new",
  "showpony:nav:guests",
  "tenant:nav:members",
] as const;

const PLATFORM_NAV_MEMBERS = [
  "admin-shell:nav:platform-overview",
  "admin-shell:nav:tenants",
  "app-shell:nav:users",
  "audit:nav:audit-log",
  "jobs:nav:job-runs",
] as const;

export const appShellFeature: FeatureDefinition = defineFeature("app-shell", (r) => {
  r.systemScope();

  r.nav({
    id: "users",
    label: "app-shell:nav.users",
    screen: "user:screen:user-list",
    order: 20,
    icon: "users",
    access: { roles: access.systemAdmin },
  });

  r.translations({
    keys: {
      "app-shell:workspace.host": { de: "Events", en: "Events" },
      "app-shell:workspace.platform": { de: "Plattform", en: "Platform" },
      "app-shell:nav.users": { de: "Nutzer", en: "Users" },
    },
  });

  r.workspace({
    id: "host",
    label: "app-shell:workspace.host",
    icon: "calendar",
    order: 1,
    access: { roles: access.admin },
    nav: [...HOST_NAV_MEMBERS],
    default: true,
  });

  r.workspace({
    id: "platform",
    label: "app-shell:workspace.platform",
    icon: "shield",
    order: 2,
    access: { roles: access.systemAdmin },
    nav: [...PLATFORM_NAV_MEMBERS],
  });
});
