import type { FeatureRegistrar } from "@cosmicdrift/kumiko-framework/engine";

export function registerShowPonyNav(r: FeatureRegistrar): void {
  r.nav({
    id: "events",
    label: "showpony:nav.events",
    icon: "calendar",
    order: 10,
    screen: "showpony:screen:event-list",
  });
  r.nav({
    id: "event-new",
    label: "showpony:nav.event-new",
    icon: "file",
    parent: "showpony:nav:events",
    screen: "showpony:screen:event-edit",
    order: 10,
  });
  r.nav({
    id: "guests",
    label: "showpony:nav.guests",
    icon: "users",
    order: 20,
    screen: "showpony:screen:rsvp-list",
  });
}
