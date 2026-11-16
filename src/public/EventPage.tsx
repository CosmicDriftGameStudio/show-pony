// The public event page. Loads the event by the slug in the URL
// (<key>.show-pony.<domain>/e/<slug>) and shows it plus the RSVP form.
// Anonymous — no login, no account.

import { useLocale, useQuery, useTranslation } from "@cosmicdrift/kumiko-renderer";
import { type ReactElement, useEffect, useState } from "react";
import { fetchDemoMode } from "../demo-mode-client";
import type { DemoModePayload } from "../demo-mode-notice";
import {
  coerceInviteBranding,
  INVITE_BRANDING_QUERY_QN,
} from "../features/show-pony/invite-branding.shared";
import { DemoPublicNotice } from "./DemoPublicNotice";
import { accentCssVars, InviteHero } from "./InviteHero";
import { icsHref } from "./ics";
import type { PublicEvent } from "./public-event";
import { RsvpForm } from "./RsvpForm";

function slugFromPath(): string {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

export function EventPage(): ReactElement {
  const t = useTranslation();
  const appLocale = useLocale().locale();
  const slug = slugFromPath();
  const eventQuery = useQuery<PublicEvent | null>("showpony:query:event:by-slug", { slug });
  const brandingQuery = useQuery<unknown>(INVITE_BRANDING_QUERY_QN, {});
  const [demo, setDemo] = useState<DemoModePayload | null>(null);

  // biome-ignore lint/plugin: /demo-mode is a boot route, not a handler; useQuery cannot serve it
  useEffect(() => {
    void fetchDemoMode().then(setDemo);
  }, []);

  const branding = coerceInviteBranding(brandingQuery.data);
  const splitPage = eventQuery.data !== null && branding.heroStyle === "split";
  const splitAccent = eventQuery.data !== null ? branding.accentColor : "";

  // Syncs split-page body classes + tenant accent CSS vars; the gradient
  // itself comes from the CSS fallback rule (styles.css) keyed off these
  // same classes, so JS never sets it inline.
  // biome-ignore lint/plugin: DOM-side-effect on document.body, not app state
  useEffect(() => {
    if (!splitPage || !splitAccent) return;
    document.body.classList.add("show-pony-public", "sp-invite-split-page");
    const vars = Object.entries(accentCssVars(splitAccent) ?? {});
    for (const [name, value] of vars) document.body.style.setProperty(name, value);
    return () => {
      document.body.classList.remove("show-pony-public", "sp-invite-split-page");
      for (const [name] of vars) document.body.style.removeProperty(name);
    };
  }, [splitPage, splitAccent]);

  if (eventQuery.loading || brandingQuery.loading) {
    return (
      <main className="mx-auto max-w-2xl p-8 text-[var(--color-muted-foreground)] show-pony-public">
        …
      </main>
    );
  }
  const event = eventQuery.data;
  if (eventQuery.error !== null || event === null) {
    return (
      <main className="mx-auto max-w-2xl p-8 show-pony-public">
        {t("showpony:public.event.missing")}
      </main>
    );
  }

  const when = new Date(event.startsAt).toLocaleString(appLocale, {
    dateStyle: "long",
    timeStyle: "short",
  });
  const guestLimit = event.guestLimit !== null && event.guestLimit > 0 ? event.guestLimit : null;
  const canvasStyle = accentCssVars(branding.accentColor);

  return (
    <div
      className={`min-h-screen show-pony-public${splitPage ? " sp-invite-split-page" : ""}`}
      // biome-ignore lint/style/noInlineStyles: tenant accent color from branding config
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
            {demo?.readOnly ? <DemoPublicNotice demo={demo} /> : <RsvpForm eventId={event.id} />}
          </section>
        </div>
      </main>
    </div>
  );
}
