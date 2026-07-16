// "Add to calendar" — a standard VCALENDAR, generated client-side as a
// data URI. No server endpoint, no signing: an .ics is plain text and
// the browser downloads it directly.

import "temporal-polyfill/global";

import type { PublicEvent } from "./api";

// ISO → ICS timestamp: 2026-07-18T18:00:00.000Z → 20260718T180000Z
function icsDate(iso: string): string {
  return Temporal.Instant.from(iso)
    .toString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
}

// Escape ICS text values: backslash, semicolon, comma, newline.
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/[;,]/g, (m) => `\\${m}`)
    .replace(/\n/g, "\\n");
}

export function buildIcs(event: PublicEvent): string {
  // Default duration 2h — the event model only stores startsAt; an end field
  // would be a separate step if anyone needs it.
  const end = Temporal.Instant.from(event.startsAt).add({ hours: 2 }).toString();
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
