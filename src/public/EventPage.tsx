// Die public Event-Page. Lädt das Event über den Slug aus der URL
// (<key>.show-pony.<domain>/e/<slug>) und zeigt es + das RSVP-Formular.
// Anonym — kein Login, kein Account.

import { type ReactElement, useEffect, useState } from "react";
import { fetchEventBySlug, type PublicEvent } from "./api";
import { RsvpForm } from "./RsvpForm";

function slugFromPath(): string {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

type Load = { kind: "loading" } | { kind: "missing" } | { kind: "ready"; event: PublicEvent };

export function EventPage(): ReactElement {
  const [load, setLoad] = useState<Load>({ kind: "loading" });

  useEffect(() => {
    void fetchEventBySlug(slugFromPath())
      .then((event) => setLoad(event ? { kind: "ready", event } : { kind: "missing" }))
      .catch(() => setLoad({ kind: "missing" }));
  }, []);

  if (load.kind === "loading") {
    return <main className="mx-auto max-w-xl p-8 text-[var(--color-muted-foreground)]">…</main>;
  }
  if (load.kind === "missing") {
    return <main className="mx-auto max-w-xl p-8">Dieses Event gibt es nicht.</main>;
  }

  const { event } = load;
  const when = new Date(event.startsAt).toLocaleString("de-DE", {
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
      <RsvpForm eventId={event.id} />
    </main>
  );
}
