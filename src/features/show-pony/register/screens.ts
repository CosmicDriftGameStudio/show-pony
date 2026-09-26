import { billingPlansPanel } from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import type { FeatureRegistrar } from "@cosmicdrift/kumiko-framework/engine";
import type {
  DashboardScreenDefinition,
  EntityEditScreenDefinition,
  EntityListScreenDefinition,
} from "@cosmicdrift/kumiko-framework/ui-types";

export const eventListScreen: EntityListScreenDefinition = {
  id: "event-list",
  type: "entityList",
  entity: "event",
  columns: ["title", "slug", "startsAt", "location", "guestLimit"],
  pageSize: 25,
  defaultSort: { field: "title", dir: "asc" },
  rowActions: [
    { kind: "navigate", id: "edit", label: "kumiko.actions.edit", screen: "event-edit" },
  ],
};

export const eventEditScreen: EntityEditScreenDefinition = {
  id: "event-edit",
  type: "entityEdit",
  entity: "event",
  layout: {
    sections: [
      {
        title: "showpony:section.event-basics",
        columns: 2,
        fields: [{ field: "title", span: 2 }, "slug", "startsAt", "location", "guestLimit"],
      },
      { title: "showpony:section.event-details", columns: 1, fields: ["description"] },
    ],
  },
};

export const rsvpListScreen: EntityListScreenDefinition = {
  id: "rsvp-list",
  type: "entityList",
  entity: "rsvp",
  columns: ["name", "status", "plusN", "email"],
  pageSize: 50,
  defaultSort: { field: "status", dir: "asc" },
};

import { inviteBrandingScreen } from "../screens/invite-branding-screen";

export const billingScreen: DashboardScreenDefinition = {
  id: "billing",
  type: "dashboard",
  panels: [
    billingPlansPanel(),
    { kind: "custom", id: "usage", component: { react: { __component: "ShowPonyUsagePanel" } } },
  ],
  access: { roles: ["Admin"] },
};

export function registerShowPonyScreens(r: FeatureRegistrar): void {
  r.screen(eventListScreen);
  r.screen(eventEditScreen);
  r.screen(rsvpListScreen);
  r.screen(inviteBrandingScreen);
  r.screen(billingScreen);
}
