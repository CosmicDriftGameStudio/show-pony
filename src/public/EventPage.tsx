// The public event page. Loads the event by the slug in the URL
// (<key>.show-pony.<domain>/e/<slug>) and shows it plus the RSVP form.
// Anonymous — no login, no account.

import { useTranslation } from "@cosmicdrift/kumiko-renderer";
import { type ReactElement, useEffect, useState } from "react";
import { fetchEventBySlug, type PublicEvent } from "./api";
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

  // kumiko-lint-ignore no-raw-hooks anonymous public bundle — one-shot fetch by slug, no dispatcher
  useEffect(() => {
    void fetchEventBySlug(slugFromPath())
      .then((event) => setLoad(event ? { kind: "ready", event } : { kind: "missing" }))
      .catch(() => setLoad({ kind: "missing" }));
  }, []);

  if (load.kind === "loading") {
    return <main className="mx-auto max-w-xl p-8 text-[var(--color-muted-foreground)]">…</main>;
  }
  if (load.kind === "missing") {
    return <main className="mx-auto max-w-xl p-8">{t("showpony:public.event.missing")}</main>;
  }

  const { event } = load;
  const when = new Date(event.startsAt).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
        {event.title}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {when}
        {event.location ? ` · ${event.location}` : ""}
      </p>
      {event.description ? (
        <p className="mt-4 whitespace-pre-line text-[var(--color-foreground)]">
          {event.description}
        </p>
      ) : null}
      <a
        href={icsHref(event)}
        download={`${event.slug}.ics`}
        className="mt-4 inline-block text-sm text-[var(--color-primary)] hover:underline"
      >
        {t("showpony:public.event.add-to-calendar")}
      </a>
      <RsvpForm eventId={event.id} />
    </main>
  );
}
