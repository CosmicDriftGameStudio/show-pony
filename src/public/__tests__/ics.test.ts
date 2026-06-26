import { describe, expect, test } from "bun:test";
import type { PublicEvent } from "../api";
import { buildIcs } from "../ics";

const EVENT: PublicEvent = {
  id: "e1",
  title: "Grill, Musik; Spaß",
  slug: "sommerfest",
  startsAt: "2026-07-18T18:00:00.000Z",
  location: "Innenhof, Berlin",
  description: "Bring jemanden mit",
  guestLimit: 60,
};

describe("buildIcs", () => {
  const ics = buildIcs(EVENT);

  test("formats the timestamp as a UTC ICS date", () => {
    expect(ics).toContain("DTSTART:20260718T180000Z");
    expect(ics).toContain("DTEND:20260718T200000Z"); // +2h default
  });

  test("escapes commas and semicolons in text fields", () => {
    expect(ics).toContain("SUMMARY:Grill\\, Musik\\; Spaß");
    expect(ics).toContain("LOCATION:Innenhof\\, Berlin");
  });

  test("is a well-formed VCALENDAR", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("\r\nEND:VCALENDAR")).toBe(true);
  });
});
