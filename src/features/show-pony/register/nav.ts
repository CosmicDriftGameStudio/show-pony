import type { FeatureRegistrar } from "@cosmicdrift/kumiko-framework/engine";

export function registerShowPonyNav(r: FeatureRegistrar): void {
  r.nav({ id: "account", icon: "wallet", label: "showpony:nav.account", order: 30 });
  r.nav({
    id: "billing",
    icon: "wallet",
    label: "showpony:nav.billing",
    parent: "showpony:nav:account",
    screen: "showpony:screen:billing",
    order: 10,
  });

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

  r.nav({ id: "appearance", icon: "sparkles", label: "showpony:nav.appearance", order: 25 });
  r.nav({
    id: "invite-branding",
    icon: "sparkles",
    label: "showpony:nav.invite-branding",
    parent: "showpony:nav:appearance",
    screen: "showpony:screen:invite-branding-settings",
    order: 10,
  });
}
