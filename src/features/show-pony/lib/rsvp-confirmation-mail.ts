import {
  mailHeading,
  mailParagraph,
  mailSubject,
} from "@cosmicdrift/kumiko-bundled-features/shared/mail-template-body";
import {
  type HandlerContext,
  type NotificationLocalizedTemplate,
  type TemplateVariables,
  templateVariable,
} from "@cosmicdrift/kumiko-framework/engine";
import type { z } from "zod";
import type { rsvpSubmitSchema } from "../handlers/rsvp-submit.write";
import type { EventRow } from "../schema/event";
import type { RsvpStatus } from "../schema/rsvp";

export const RSVP_CONFIRMATION_NOTIFICATION = "rsvp-confirmation";
export const RSVP_CONFIRMATION_TYPE = "showpony:notify:rsvp-confirmation";

export function mailVariableLabel(name: string): string {
  return `showpony:mail.variable.${name}`;
}

export function mailVariableExample(name: string): string {
  return `showpony:mail.example.${name}`;
}

export const RSVP_CONFIRMATION_VARIABLES: TemplateVariables = {
  eventTitle: templateVariable.text({
    label: mailVariableLabel("eventTitle"),
    required: true,
    example: mailVariableExample("eventTitle"),
  }),
  answer: templateVariable.text({
    label: mailVariableLabel("answer"),
    required: true,
    example: mailVariableExample("answer"),
  }),
};

const MAIL_LOCALES = ["en", "de"] as const;
export type MailLocale = (typeof MAIL_LOCALES)[number];

function isMailLocale(language: string): language is MailLocale {
  return (MAIL_LOCALES as readonly string[]).includes(language);
}

function resolveMailLocale(locale: string | undefined): MailLocale {
  const language = (locale ?? "").split("-")[0]?.toLowerCase() ?? "";
  return isMailLocale(language) ? language : "en";
}

type MailStrings = {
  readonly subject: string;
  readonly heading: string;
  readonly body: string;
  readonly answers: Readonly<Record<RsvpStatus, string>>;
};

const MAIL_STRINGS: Readonly<Record<MailLocale, MailStrings>> = {
  en: {
    subject: 'Your RSVP for "{eventTitle}"',
    heading: "Your reply is in",
    body: 'Your reply ({answer}) for "{eventTitle}" is in. Thanks!',
    answers: { yes: "Coming", no: "Not coming", maybe: "Maybe" },
  },
  de: {
    subject: "Deine Antwort für „{eventTitle}“",
    heading: "Deine Antwort ist angekommen",
    body: "Deine Antwort ({answer}) für „{eventTitle}“ ist angekommen. Danke!",
    answers: { yes: "Ich komme", no: "Ich komme nicht", maybe: "Vielleicht" },
  },
};

export function rsvpAnswerLabel(locale: MailLocale, status: RsvpStatus): string {
  return MAIL_STRINGS[locale].answers[status];
}

export function rsvpConfirmationTemplate(): NotificationLocalizedTemplate {
  return Object.fromEntries(
    MAIL_LOCALES.map((locale) => {
      const strings = MAIL_STRINGS[locale];
      return [
        locale,
        {
          body: mailHeading(strings.heading) + mailParagraph(strings.body),
          meta: { subject: mailSubject(strings.subject), category: "transactional" as const },
        },
      ];
    }),
  );
}

// The guest's name stays out of the mail: the address is unverified, so any text
// in it could be planted by whoever typed someone else's email.
// Best-effort: a mail problem must not fail the RSVP.
// kumiko-lint-ignore lib-test-coverage integration-covered via rsvp-anonymous.integration.test.ts
export async function sendRsvpConfirmation(
  ctx: HandlerContext,
  payload: z.infer<typeof rsvpSubmitSchema>,
  eventRow: EventRow,
): Promise<void> {
  // skip: guest left email empty — nothing to send
  if (!payload.email) return;
  const locale = resolveMailLocale(ctx.locale);
  if (!ctx.notify) {
    ctx.log?.error("[showpony:rsvp-submit] ctx.notify unavailable, delivery feature not mounted");
    return;
  }
  try {
    await ctx.notify(RSVP_CONFIRMATION_TYPE, {
      route: { email: payload.email },
      data: { eventTitle: eventRow.title, answer: rsvpAnswerLabel(locale, payload.status) },
      priority: "normal",
      locale,
    });
  } catch (err) {
    ctx.log?.warn("[showpony:rsvp-submit] confirmation mail failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
