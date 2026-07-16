// The public event page. Loads the event by the slug in the URL
// (<key>.show-pony.<domain>/e/<slug>) and shows it plus the RSVP form.
// Anonymous — no login, no account.

import { useTranslation } from "@cosmicdrift/kumiko-renderer";
import { type ReactElement, useEffect, useState } from "react";
import { fetchDemoMode } from "../demo-mode-client";
import {
  EMPTY_INVITE_BRANDING,
  type InviteBranding,
} from "../features/show-pony/invite-branding.shared";
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

// The gradient itself lives once, in styles.css's `.sp-invite-split-page`
// fallback rule — it reads var(--color-primary)/var(--color-ring), so
// setting just these two custom properties is enough for the CSS rule to
// paint the same gradient with the tenant's accent, no JS-side duplicate.
function splitInviteCanvasStyle(accent: string): Record<string, string> {
  return {
    "--color-primary": accent,
    "--color-ring": accent,
  };
}

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

  const splitPage = load.kind === "ready" && load.branding.heroStyle === "split";
  const splitAccent = load.kind === "ready" ? load.branding.accentColor : "";

  // Syncs split-page body classes + tenant accent CSS vars; the gradient
  // itself comes from the CSS fallback rule (styles.css) keyed off these
  // same classes, so JS never sets it inline.
  // kumiko-lint-ignore no-raw-hooks DOM-side-effect on document.body, not app state
  useEffect(() => {
    if (!splitPage || !splitAccent) return;
    document.body.classList.add("show-pony-public", "sp-invite-split-page");
    document.body.style.setProperty("--color-primary", splitAccent);
    document.body.style.setProperty("--color-ring", splitAccent);
    return () => {
      document.body.classList.remove("show-pony-public", "sp-invite-split-page");
      document.body.style.removeProperty("--color-primary");
      document.body.style.removeProperty("--color-ring");
    };
  }, [splitPage, splitAccent]);

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
  const canvasStyle =
    splitPage && splitAccent
      ? splitInviteCanvasStyle(splitAccent)
      : inviteBrandingCssVars(branding);

  return (
    // kumiko-lint-ignore no-inline-styles tenant accent color from branding config
    <div
      className={`min-h-screen show-pony-public${splitPage ? " sp-invite-split-page" : ""}`}
      style={canvasStyle}
    >
      <InviteHero
        branding={branding}
        title={event.title}
        when={when}
        location={event.location || null}
        guestLimit={guestLimit}
      />

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
        <div className="space-y-6">
          <section
            className={
              event.description
                ? "rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6"
                : "sp-invite-card rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6"
            }
          >
            {event.description ? (
              <p className="whitespace-pre-line text-[var(--color-foreground)] leading-relaxed">
                {event.description}
              </p>
            ) : null}
            <a
              href={icsHref(event)}
              download={`${event.slug}.ics`}
              className={`${event.description ? "mt-5 " : ""}inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline`}
            >
              {t("showpony:public.event.add-to-calendar")}
            </a>
          </section>

          <section className="sp-invite-card rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
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
