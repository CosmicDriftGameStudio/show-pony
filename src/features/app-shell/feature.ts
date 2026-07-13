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
  "showpony:nav:appearance",
  "showpony:nav:invite-branding",
  "showpony:nav:account",
  "showpony:nav:billing",
  "tenant:nav:members",
] as const;

const PLATFORM_NAV_MEMBERS = [
  "admin-shell:nav:platform-overview",
  "admin-shell:nav:tenants",
  "admin-shell:nav:tier-admin",
  "config:nav:audience-system",
  "app-shell:nav:users",
  "audit:nav:audit-log",
  "jobs:nav:job-runs",
] as const;

/** Tenant-scoped host tools — excludes global SystemAdmin (platform workspace). */
const HOST_WORKSPACE_ROLES = access.roles("TenantAdmin", "Admin");

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
      // tenant feature label is tenant:nav.members; tenantClient bundles tenant.nav.members.
      "tenant:nav.members": { de: "Team", en: "Team" },
    },
  });

  r.workspace({
    id: "host",
    label: "app-shell:workspace.host",
    icon: "calendar",
    order: 1,
    access: { roles: HOST_WORKSPACE_ROLES },
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

