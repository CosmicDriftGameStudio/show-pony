// The public event page. Loads the event by the slug in the URL
// (<key>.show-pony.<domain>/e/<slug>) and shows it plus the RSVP form.
// Anonymous — no login, no account.

import { useTranslation } from "@cosmicdrift/kumiko-renderer";
import { type ReactElement, useEffect, useState } from "react";
import { fetchDemoMode } from "../demo-mode-client";
import { EMPTY_INVITE_BRANDING, type InviteBranding } from "../features/show-pony/invite-branding";
import { fetchEventBySlug, fetchInviteBranding, type PublicEvent } from "./api";
import { DemoPublicNotice } from "./DemoPublicNotice";
import { InviteHero, inviteBrandingCssVars } from "./InviteHero";
import { icsHref } from "./ics";
import { RsvpForm } from "./RsvpForm";

function slugFromPath(): string {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

type Load =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "ready"; event: PublicEvent; branding: InviteBranding };

export function EventPage(): ReactElement {
  const t = useTranslation();
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [readOnly, setReadOnly] = useState(false);

  // kumiko-lint-ignore no-raw-hooks anonymous public bundle — one-shot fetch by slug, no dispatcher
  useEffect(() => {
    void fetchDemoMode().then((demo) => setReadOnly(demo.readOnly));
    const slug = slugFromPath();
    void Promise.all([fetchEventBySlug(slug), fetchInviteBranding()])
      .then(([event, branding]) =>
        setLoad(
          event
            ? { kind: "ready", event, branding: branding ?? EMPTY_INVITE_BRANDING }
            : { kind: "missing" },
        ),
      )
      .catch(() => setLoad({ kind: "missing" }));
  }, []);

  if (load.kind === "loading") {
    return (
      <main className="mx-auto max-w-2xl p-8 text-[var(--color-muted-foreground)] show-pony-public">
        …
      </main>
    );
  }
  if (load.kind === "missing") {
    return (
      <main className="mx-auto max-w-2xl p-8 show-pony-public">
        {t("showpony:public.event.missing")}
      </main>
    );
  }

  const { event, branding } = load;
  const when = new Date(event.startsAt).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
  const guestLimit = event.guestLimit > 0 ? event.guestLimit : null;

  return (
    <div className="min-h-screen show-pony-public" style={inviteBrandingCssVars(branding)}>
      <InviteHero
        branding={branding}
        title={event.title}
        when={when}
        location={event.location || null}
        guestLimit={guestLimit}
      />

      <main className="mx-auto max-w-2xl px-4 pb-12 sm:px-6">
        <div className="-mt-6 space-y-6">
          {event.description ? (
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
              <p className="whitespace-pre-line text-[var(--color-foreground)] leading-relaxed">
                {event.description}
              </p>
              <a
                href={icsHref(event)}
                download={`${event.slug}.ics`}
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {t("showpony:public.event.add-to-calendar")}
              </a>
            </section>
          ) : (
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
              <a
                href={icsHref(event)}
                download={`${event.slug}.ics`}
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {t("showpony:public.event.add-to-calendar")}
              </a>
            </section>
          )}

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t("showpony:public.rsvp.heading")}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {t("showpony:public.rsvp.subheading")}
            </p>
            {readOnly ? <DemoPublicNotice /> : <RsvpForm eventId={event.id} />}
          </section>
        </div>
      </main>
    </div>
  );
}
