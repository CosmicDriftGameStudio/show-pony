// "Zum Kalender hinzufügen" — ein Standard-VCALENDAR, clientseitig als
// data-URI generiert. Kein Server-Endpoint, kein Signing: ein .ics ist
// nur Text, und der Browser lädt ihn direkt herunter.

import type { PublicEvent } from "./api";

// ISO → ICS-Zeitstempel: 2026-07-18T18:00:00.000Z → 20260718T180000Z
function icsDate(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

// ICS-Textwerte escapen: Backslash, Semikolon, Komma, Newline.
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/[;,]/g, (m) => `\\${m}`)
    .replace(/\n/g, "\\n");
}

export function buildIcs(event: PublicEvent): string {
  // Default-Dauer 2h — das Event-Modell hält nur startsAt; ein End-Feld
  // wäre ein eigener Schritt, falls jemand es braucht.
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
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function icsHref(event: PublicEvent): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcs(event))}`;
}
