// The public event page. Loads the event by the slug in the URL
// (<key>.show-pony.<domain>/e/<slug>) and shows it plus the RSVP form.
// Anonymous — no login, no account.

import { useTranslation } from "@cosmicdrift/kumiko-renderer";
import { type ReactElement, useEffect, useState } from "react";
import { fetchDemoMode } from "../demo-mode-client";
import { fetchEventBySlug, type PublicEvent } from "./api";
import { DemoPublicNotice } from "./DemoPublicNotice";
import { icsHref } from "./ics";
import { RsvpForm } from "./RsvpForm";

function slugFromPath(): string {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

type Load = { kind: "loading" } | { kind: "missing" } | { kind: "ready"; event: PublicEvent };

export function EventPage(): ReactElement {
  const t = useTranslation();
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [readOnly, setReadOnly] = useState(false);

  // kumiko-lint-ignore no-raw-hooks anonymous public bundle — one-shot fetch by slug, no dispatcher
  useEffect(() => {
    void fetchDemoMode().then((demo) => setReadOnly(demo.readOnly));
    void fetchEventBySlug(slugFromPath())
      .then((event) => setLoad(event ? { kind: "ready", event } : { kind: "missing" }))
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

  const { event } = load;
  const when = new Date(event.startsAt).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
  return (
    <div className="min-h-screen show-pony-public">
      <header className="bg-[var(--color-primary)] px-6 py-12 text-[var(--color-primary-foreground)] sm:px-10">
        <p className="text-sm font-medium uppercase tracking-widest opacity-90">
          {t("showpony:public.event.invited")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{event.title}</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--color-primary-foreground)]/15 px-3 py-1 text-sm">
            {when}
          </span>
          {event.location ? (
            <span className="rounded-full bg-[var(--color-primary-foreground)]/15 px-3 py-1 text-sm">
              {event.location}
            </span>
          ) : null}
          {event.guestLimit != null && event.guestLimit > 0 ? (
            <span className="rounded-full bg-[var(--color-primary-foreground)]/15 px-3 py-1 text-sm">
              {t("showpony:public.event.guest-limit", { limit: String(event.guestLimit) })}
            </span>
          ) : null}
        </div>
      </header>

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
