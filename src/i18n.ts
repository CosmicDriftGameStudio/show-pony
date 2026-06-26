// show-pony i18n-Bundle. Convention: feature-prefix `showpony:`
// + `entity:<e>:field:<name>` für Field-Labels (Spalten + Form),
// `screen:<id>.title` für Page-Titles, `showpony:nav.<id>` für
// Sidebar-Labels, `:option:<value>` für Select-Werte.

import type { TranslationsByLocale } from "@cosmicdrift/kumiko-renderer";

export const showPonyTranslations: TranslationsByLocale = {
  de: {
    "showpony:nav.events": "Events",
    "showpony:nav.event-new": "Neues Event",
    "showpony:nav.guests": "Gästeliste",

    "screen:event-list.title": "Events",
    "screen:event-edit.title": "Event bearbeiten",
    "screen:rsvp-list.title": "Gästeliste",

    "showpony:section.event-basics": "Eckdaten",
    "showpony:section.event-details": "Beschreibung",

    "showpony:entity:event:field:title": "Titel",
    "showpony:entity:event:field:slug": "Link-Kürzel",
    "showpony:entity:event:field:startsAt": "Beginn",
    "showpony:entity:event:field:location": "Ort",
    "showpony:entity:event:field:description": "Beschreibung",
    "showpony:entity:event:field:guestLimit": "Gäste-Limit",

    "showpony:entity:rsvp:field:name": "Name",
    "showpony:entity:rsvp:field:email": "E-Mail",
    "showpony:entity:rsvp:field:status": "Status",
    "showpony:entity:rsvp:field:plusN": "Begleitung",
    "showpony:entity:rsvp:field:eventId": "Event",
    "showpony:entity:rsvp:field:note": "Notiz",

    "showpony:entity:rsvp:field:status:option:yes": "Zusage",
    "showpony:entity:rsvp:field:status:option:no": "Absage",
    "showpony:entity:rsvp:field:status:option:maybe": "Vielleicht",
  },
  en: {
    "showpony:nav.events": "Events",
    "showpony:nav.event-new": "New event",
    "showpony:nav.guests": "Guest list",

    "screen:event-list.title": "Events",
    "screen:event-edit.title": "Edit event",
    "screen:rsvp-list.title": "Guest list",

    "showpony:section.event-basics": "Basics",
    "showpony:section.event-details": "Description",

    "showpony:entity:event:field:title": "Title",
    "showpony:entity:event:field:slug": "Link slug",
    "showpony:entity:event:field:startsAt": "Starts at",
    "showpony:entity:event:field:location": "Location",
    "showpony:entity:event:field:description": "Description",
    "showpony:entity:event:field:guestLimit": "Guest limit",

    "showpony:entity:rsvp:field:name": "Name",
    "showpony:entity:rsvp:field:email": "Email",
    "showpony:entity:rsvp:field:status": "Status",
    "showpony:entity:rsvp:field:plusN": "Plus guests",
    "showpony:entity:rsvp:field:eventId": "Event",
    "showpony:entity:rsvp:field:note": "Note",

    "showpony:entity:rsvp:field:status:option:yes": "Going",
    "showpony:entity:rsvp:field:status:option:no": "Not going",
    "showpony:entity:rsvp:field:status:option:maybe": "Maybe",
  },
};
