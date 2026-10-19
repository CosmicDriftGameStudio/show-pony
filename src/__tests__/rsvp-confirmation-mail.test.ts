import { describe, expect, test } from "bun:test";
import { showPonyTranslations } from "../features/show-pony/i18n/keys";
import {
  mailVariableExample,
  mailVariableLabel,
  RSVP_CONFIRMATION_VARIABLES,
  rsvpAnswerLabel,
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

describe("mail variable translations", () => {
  const entries = Object.entries(RSVP_CONFIRMATION_VARIABLES);
  const translations: Readonly<Record<string, { readonly de: string; readonly en: string }>> =
    showPonyTranslations;
  const translationOf = (key: string) => translations[key];

  test("every variable has a de and en label", () => {
    for (const [name] of entries) {
      const entry = translationOf(mailVariableLabel(name));
      expect(entry?.de, name).toBeTruthy();
      expect(entry?.en, name).toBeTruthy();
    }
  });

  test("every text variable has a de and en example behind its example key", () => {
    for (const [name, variable] of entries) {
      if (variable.type !== "text" && variable.type !== "richText") continue;
      expect(variable.example, name).toBe(mailVariableExample(name));
      const entry = translationOf(mailVariableExample(name));
      expect(entry?.de, name).toBeTruthy();
      expect(entry?.en, name).toBeTruthy();
    }
  });

  test.each(["en", "de"] as const)("%s answer example matches the sent yes answer", (locale) => {
    expect(translationOf(mailVariableExample("answer"))?.[locale]).toBe(
      rsvpAnswerLabel(locale, "yes"),
    );
  });
});
