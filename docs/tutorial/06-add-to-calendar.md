# Zum Kalender hinzufügen — ein .ics ohne Server

Ein „Add to Calendar"-Button braucht weder einen Server-Endpoint noch eine
Library. Ein `.ics` ist nur Text im VCALENDAR-Format, und der Browser lädt
ihn direkt als data-URI herunter.

```ts
export function buildIcs(event: PublicEvent): string {
  const end = new Date(new Date(event.startsAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//show-pony//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@show-pony`,
    `DTSTAMP:${icsDate(event.startsAt)}`,
    `DTSTART:${icsDate(event.startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(event.title)}`,
    event.location ? `LOCATION:${esc(event.location)}` : "",
    event.description ? `DESCRIPTION:${esc(event.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}
```

Zwei Stolpersteine machen das Feature non-trivial — und sind genau das, was
der Mini-Test pinnt:

- **Zeitstempel:** ICS will UTC als `YYYYMMDDTHHMMSSZ`. Aus dem ISO-String
  `2026-07-18T18:00:00.000Z` wird `20260718T180000Z` (Bindestriche,
  Doppelpunkte und Millisekunden raus).
- **Escaping:** Komma, Semikolon, Backslash und Newline müssen in Textfeldern
  mit `\` escaped werden — sonst zerbricht ein Titel wie „Grill, Musik" die
  Datei.

Auf der Event-Page ist es ein Link, kein Button-mit-Fetch:

```tsx
<a href={icsHref(event)} download={`${event.slug}.ics`}>
  📅 Zum Kalender hinzufügen
</a>
```

`icsHref` packt das VCALENDAR in einen `data:text/calendar`-URI; das
`download`-Attribut gibt dem File einen Namen. Kein State, kein Request —
der Klick lädt die Datei, das Betriebssystem öffnet den Kalender.
