import { billingPlansPanel } from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { CAP_CARDS_PANEL_COMPONENT } from "@cosmicdrift/kumiko-bundled-features/cap-overview";
import { access, type FeatureRegistrar } from "@cosmicdrift/kumiko-framework/engine";
import type {
  DashboardScreenDefinition,
  EntityEditScreenDefinition,
  EntityListScreenDefinition,
} from "@cosmicdrift/kumiko-framework/ui-types";
import { BILLING_ROLES } from "../billing/plan-catalog";

export const eventListScreen: EntityListScreenDefinition = {
  id: "event-list",
  type: "entityList",
  entity: "event",
  columns: ["title", "slug", "startsAt", "location", { field: "guestLimit", hideOnNarrow: true }],
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
  recordTitleField: "title",
  access: { roles: access.admin },
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
  columns: ["eventId", "name", "status", "plusN", "email", { field: "note", hideOnNarrow: true }],
  pageSize: 50,
  defaultSort: { field: "status", dir: "asc" },
  access: { roles: access.admin },
};

import { inviteBrandingScreen } from "../screens/invite-branding-screen";

export const billingScreen: DashboardScreenDefinition = {
  id: "billing",
  type: "dashboard",
  panels: [
    billingPlansPanel(),
    { kind: "custom", id: "usage", component: { react: { __component: CAP_CARDS_PANEL_COMPONENT } } },
  ],
  access: { roles: BILLING_ROLES },
};

export function registerShowPonyScreens(r: FeatureRegistrar): void {
  r.screen(eventListScreen);
  r.screen(eventEditScreen);
  r.screen(rsvpListScreen);
  r.screen(inviteBrandingScreen);
  r.screen(billingScreen);
}
