// show-pony i18n keys. Convention: feature prefix `showpony:`
// + `entity:<e>:field:<name>` for field labels (columns + form),
// `screen:<id>.title` for page titles, `showpony:nav.<id>` for
// sidebar labels, `:option:<value>` for select values.

type LocaleEntry = { de: string; en: string };

export const showPonyTranslations = {
  "showpony:nav.events": { de: "Events", en: "Events" },
  "showpony:nav.event-new": { de: "Neues Event", en: "New event" },
  "showpony:nav.guests": { de: "Gästeliste", en: "Guest list" },
  "showpony:nav.account": { de: "Konto", en: "Account" },
  "showpony:nav.billing": { de: "Tarif & Abrechnung", en: "Plan & billing" },

  "screen:event-list.title": { de: "Events", en: "Events" },
  "screen:event-edit.title": { de: "Event bearbeiten", en: "Edit event" },
  "screen:rsvp-list.title": { de: "Gästeliste", en: "Guest list" },
  "screen:billing.title": { de: "Tarif & Abrechnung", en: "Plan & billing" },

  "showpony:section.event-basics": { de: "Eckdaten", en: "Basics" },
  "showpony:section.event-details": { de: "Beschreibung", en: "Description" },

  "showpony:entity:event:field:title": { de: "Titel", en: "Title" },
  "showpony:entity:event:field:slug": { de: "Link-Kürzel", en: "Link slug" },
  "showpony:entity:event:field:startsAt": { de: "Beginn", en: "Starts at" },
  "showpony:entity:event:field:location": { de: "Ort", en: "Location" },
  "showpony:entity:event:field:description": { de: "Beschreibung", en: "Description" },
  "showpony:entity:event:field:guestLimit": { de: "Gäste-Limit", en: "Guest limit" },

  "showpony:entity:rsvp:field:name": { de: "Name", en: "Name" },
  "showpony:entity:rsvp:field:email": { de: "E-Mail", en: "Email" },
  "showpony:entity:rsvp:field:status": { de: "Status", en: "Status" },
  "showpony:entity:rsvp:field:plusN": { de: "Begleitung", en: "Plus guests" },
  "showpony:entity:rsvp:field:eventId": { de: "Event", en: "Event" },
  "showpony:entity:rsvp:field:note": { de: "Notiz", en: "Note" },

  "showpony:entity:rsvp:field:status:option:yes": { de: "Zusage", en: "Going" },
  "showpony:entity:rsvp:field:status:option:no": { de: "Absage", en: "Not going" },
  "showpony:entity:rsvp:field:status:option:maybe": { de: "Vielleicht", en: "Maybe" },

  "showpony:public.event.missing": {
    de: "Dieses Event gibt es nicht.",
    en: "This event doesn't exist.",
  },
  "showpony:public.event.invited": { de: "Du bist eingeladen", en: "You're invited" },
  "showpony:public.event.guest-limit": {
    de: "Bis zu {limit} Gäste",
    en: "Up to {limit} guests",
  },
  "showpony:public.event.add-to-calendar": {
    de: "📅 Zum Kalender hinzufügen",
    en: "📅 Add to calendar",
  },
  "showpony:public.rsvp.thanks": { de: "Danke, {name}!", en: "Thanks, {name}!" },
  "showpony:public.rsvp.heading": { de: "RSVP", en: "RSVP" },
  "showpony:public.rsvp.subheading": {
    de: "Kein Account nötig — Name reicht.",
    en: "No account needed — just your name.",
  },
  "showpony:public.rsvp.on-list": { de: "Du stehst auf der Liste.", en: "You're on the list." },
  "showpony:public.rsvp.plus-guests": { de: "Begleitung?", en: "Bringing anyone?" },
  "showpony:public.rsvp.name": { de: "Name", en: "Name" },
  "showpony:public.rsvp.name-placeholder": { de: "Dein Name", en: "Your name" },
  "showpony:public.rsvp.email": { de: "E-Mail (optional)", en: "Email (optional)" },
  "showpony:public.rsvp.email-placeholder": {
    de: "E-Mail (optional, für die Bestätigung)",
    en: "Email (optional, for your confirmation)",
  },
  "showpony:public.rsvp.status.yes": { de: "Ich komme", en: "I'm in" },
  "showpony:public.rsvp.status.maybe": { de: "Vielleicht", en: "Maybe" },
  "showpony:public.rsvp.status.no": { de: "Kann leider nicht", en: "Can't make it" },
  "showpony:public.rsvp.submit": { de: "RSVP senden", en: "Send RSVP" },
  "showpony:public.rsvp.error": {
    de: "Etwas ist schiefgelaufen ({reason}). Bitte nochmal versuchen.",
    en: "Something went wrong ({reason}). Try again.",
  },

  "showpony:demo.login.title": { de: "Live-Demo", en: "Live demo" },
  "showpony:demo.login.body": {
    de: "Melde dich an, um Dashboard und Plattform-Workspace zu erkunden:",
    en: "Sign in to explore the host dashboard and platform workspace:",
  },
  "showpony:demo.login.read-only": {
    de: "Nur ansehen — Änderungen werden auf dieser Instanz nicht gespeichert.",
    en: "Browse only — changes are not saved on this instance.",
  },
  "showpony:demo.banner": {
    de: "Live-Demo (read-only). Zum Bauen lokal klonen —",
    en: "Live demo (read-only). Clone locally to build your own —",
  },
  "showpony:demo.banner.link": { de: "Tutorial", en: "tutorial" },
  "showpony:demo.public.title": { de: "Live-Demo", en: "Live demo" },
  "showpony:demo.public.body": {
    de: "RSVPs funktionieren nur in der lokalen Installation. Hier kannst du die Invite-Seite ansehen.",
    en: "RSVPs work in the local install only. Here you can browse the invite page.",
  },
  "showpony:demo.public.host-link": { de: "Host-Login", en: "Host login" },
  "showpony:demo.public.tutorial-link": { de: "Tutorial", en: "Tutorial" },
  "showpony:demo.read-only.error": {
    de: "Live-Demo ist read-only — lokal klonen zum Ausprobieren.",
    en: "Live demo is read-only — clone locally to try writes.",
  },

  "showpony:caps.usageTitle": { de: "Verbrauch", en: "Usage" },
  "showpony:caps.events": { de: "Events", en: "Events" },
  "showpony:caps.guests": { de: "RSVPs", en: "RSVPs" },
  "showpony:caps.unlimited": { de: "(unbegrenzt)", en: "(unlimited)" },
  "showpony:caps.upgradeHint": { de: "Tarif upgraden", en: "Upgrade plan" },

  "showpony:billing.title": { de: "Tarif & Abrechnung", en: "Plan & billing" },
  "showpony:billing.currentTier": { de: "Aktueller Tarif", en: "Current plan" },
  "showpony:billing.notConfigured": {
    de: "Stripe-Checkout ist auf dieser Instanz nicht live (billingLive aus oder keine API-Keys).",
    en: "Stripe checkout is not live on this instance (billingLive off or no API keys).",
  },
  "showpony:billing.upgradeTo": { de: "Wechseln zu", en: "Switch to" },
  "showpony:billing.perMonth": { de: "€ / Monat", en: "€ / month" },
  "showpony:billing.unlimited": { de: "Unbegrenzt", en: "Unlimited" },
  "showpony:billing.benefit.events": { de: "Events", en: "events" },
  "showpony:billing.benefit.guests": { de: "RSVPs gesamt", en: "total RSVPs" },
  "showpony:billing.managePortal": { de: "Abrechnung verwalten", en: "Manage billing" },
  "showpony:billing.portalHint": {
    de: "Rechnungen und Zahlungsmittel verwaltest du im Stripe-Portal.",
    en: "Manage invoices and payment methods in the Stripe portal.",
  },
  "showpony:billing.redirecting": {
    de: "Weiterleitung zu Stripe …",
    en: "Redirecting to Stripe …",
  },
  "showpony:billing.error": { de: "Checkout fehlgeschlagen", en: "Checkout failed" },
  "showpony:billing.status.active": { de: "aktiv", en: "active" },
  "showpony:billing.status.trialing": { de: "Testphase", en: "trial" },
  "showpony:billing.status.past_due": { de: "Zahlung überfällig", en: "past due" },
  "showpony:billing.status.canceled": { de: "gekündigt", en: "canceled" },
  "showpony:billing.status.incomplete": { de: "unvollständig", en: "incomplete" },
  "showpony:billing.status.incomplete_expired": {
    de: "abgelaufen",
    en: "expired",
  },
  "showpony:billing.status.unpaid": { de: "unbezahlt", en: "unpaid" },
  "showpony:billing.status.paused": { de: "pausiert", en: "paused" },
  "showpony:billing.switchInPortal": { de: "Im Portal wechseln zu", en: "Switch in portal to" },

  "showpony:errors.eventLimitReached": {
    de: "Event-Limit erreicht — Tarif upgraden.",
    en: "Event limit reached — upgrade your plan.",
  },
  "showpony:errors.guestLimitReached": {
    de: "Die Gästeliste ist voll.",
    en: "The guest list is full.",
  },
} as const satisfies Record<string, LocaleEntry>;
