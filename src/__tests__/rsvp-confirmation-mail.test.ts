import { describe, expect, test } from "bun:test";
import {
  RSVP_CONFIRMATION_VARIABLES,
  rsvpConfirmationTemplate,
} from "../features/show-pony/lib/rsvp-confirmation-mail";

const VARIABLE_MARKER = /data-variable="(\w+)"/g;

describe("rsvpConfirmationTemplate", () => {
  const template = rsvpConfirmationTemplate();

  test("ships an en and a de variant", () => {
    expect(Object.keys(template).sort()).toEqual(["de", "en"]);
  });

  test.each(["en", "de"] as const)(
    "%s body references exactly the declared variables",
    (locale) => {
      const used = new Set(
        [...(template[locale]?.body ?? "").matchAll(VARIABLE_MARKER)].map((m) => m[1]),
      );
      expect([...used].sort()).toEqual(Object.keys(RSVP_CONFIRMATION_VARIABLES).sort());
    },
  );

  test.each(["en", "de"] as const)(
    "%s subject is non-empty and carries the event title",
    (locale) => {
      const subject = JSON.stringify(template[locale]?.meta.subject);
      expect(subject.length).toBeGreaterThan(2);
      expect(subject).toContain("eventTitle");
    },
  );
});
