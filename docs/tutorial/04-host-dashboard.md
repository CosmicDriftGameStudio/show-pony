# Das Host-Dashboard — Screens aus dem Schema

Ein Host muss Events anlegen und sehen, wer kommt. In Kumiko ist diese
Oberfläche **kein handgeschriebenes React** — sie wird aus dem Entity-Schema
abgeleitet. Drei Screen-Definitionen + eine Navigation, und das Framework
rendert Listen- und Edit-Screens generisch.

## Screens sind Daten, kein Code

Ein `entityList`- bzw. `entityEdit`-Screen ist ein reines Objekt: welche
Entity, welche Spalten, welches Form-Layout. Kein Component, kein State, kein
Fetch — das alles liefert der Framework-Default.

```ts
export const eventListScreen: EntityListScreenDefinition = {
  id: "event-list",
  type: "entityList",
  entity: "event",
  columns: ["title", "slug", "startsAt", "location", "guestLimit"],
  pageSize: 25,
  defaultSort: { field: "title", dir: "asc" },
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
```

Die Gästeliste ist derselbe Mechanismus auf der `rsvp`-Entity — ein
`entityList` mit den Spalten `name`, `status`, `plusN`, `email`.

## Registrieren + navigierbar machen

Im Feature werden die Screens registriert und in die Sidebar gehängt. Der
`screen`-Verweis folgt der Konvention `<feature>:screen:<id>`:

```ts
r.screen(eventListScreen);
r.screen(eventEditScreen);
r.screen(rsvpListScreen);
r.nav({ id: "events", label: "showpony:nav.events", order: 10, screen: "showpony:screen:event-list" });
r.nav({ id: "guests", label: "showpony:nav.guests", order: 20, screen: "showpony:screen:rsvp-list" });
```

## Text getrennt vom Schema

Alle sichtbaren Strings sind **i18n-Keys**, keine Literale — Spalten-Header,
Form-Labels, Nav-Einträge, Select-Optionen. Die Übersetzungen leben in
`src/i18n.ts` (de + en) und kommen über das Client-Feature in die App:

```ts
export const showPonyClient: ClientFeatureDefinition = {
  name: "showpony",
  translations: showPonyTranslations,
};
```

So bleibt `feature.ts` sprachneutral, und eine neue Sprache ist ein
zusätzlicher Block in `i18n.ts` — keine Code-Änderung.

## Die Shell

Der Browser-Entry ist drei Zeilen: `createKumikoApp` mit einer Shell und der
Feature-Liste. `DefaultAppShell` bringt Sidebar, Topbar und das Rendering der
Screens mit; wir setzen nur die Wortmarke.

```ts
createKumikoApp({
  shell: AppShell,
  clientFeatures: [showPonyClient],
});
```

Das Ergebnis: ein vollständiges Host-Dashboard — Event-Liste, Event-Formular,
Gästeliste, lokalisiert — ohne eine einzige handgeschriebene Tabelle oder
Form. Was der Host tippt, ist tenant-scoped: er sieht nur die eigenen Events
und Gäste.
