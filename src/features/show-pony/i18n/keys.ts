// show-pony i18n keys. Convention: feature prefix `showpony:`
// + `entity:<e>:field:<name>` for field labels (columns + form),
// `screen:<id>.title` for page titles, `showpony:nav.<id>` for
// sidebar labels, `:option:<value>` for select values.

type LocaleEntry = { de: string; en: string };

export const showPonyTranslations = {
  "showpony:nav.events": { de: "Events", en: "Events" },
  "showpony:nav.event-new": { de: "Neues Event", en: "New event" },
  "showpony:nav.guests": { de: "Gästeliste", en: "Guest list" },

  "screen:event-list.title": { de: "Events", en: "Events" },
  "screen:event-edit.title": { de: "Event bearbeiten", en: "Edit event" },
  "screen:rsvp-list.title": { de: "Gästeliste", en: "Guest list" },

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
} as const satisfies Record<string, LocaleEntry>;
