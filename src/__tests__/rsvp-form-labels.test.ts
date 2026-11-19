import { expect, test } from "bun:test";
import { showPonyTranslations } from "../features/show-pony/i18n";

// The placeholder sits in a narrow input on phones; repeating the label there got it cut off mid-word.
test.each(["de", "en"] as const)(
  "RSVP email placeholder does not repeat the label (%s)",
  (locale) => {
    const label = showPonyTranslations["showpony:public.rsvp.email"][locale];
    const placeholder = showPonyTranslations["showpony:public.rsvp.email-placeholder"][locale];
    const labelWord = label.split(" ")[0] ?? label;
    expect(placeholder.startsWith(labelWord)).toBe(false);
  },
);
