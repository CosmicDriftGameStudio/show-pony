// Public page mount — imported by the client-public.tsx bundle, which the
// server delivers via hostDispatch to every tenant subdomain. One route:
// the event page (slug from the URL). No react-router needed.
//
// createPublicSurface = the framework's schema-less anonymous mount (Locale +
// Primitives + Dispatcher, no schema-inject) — same pattern as publicstatus's
// public mount. RsvpForm needs the Primitives (Form/Input/Button) it provides.

import { createStaticLocaleResolver } from "@cosmicdrift/kumiko-renderer";
import { createPublicSurface } from "@cosmicdrift/kumiko-renderer-web";
import { showPonyTranslationsByLocale } from "../features/show-pony/i18n";
import { EventPage } from "./EventPage";

function publicLocale(): string {
  const lang = navigator.language.split("-")[0] ?? "en";
  return lang === "de" ? "de" : "en";
}

export function mountPublic(): void {
  createPublicSurface({
    routes: [],
    fallback: <EventPage />,
    locale: createStaticLocaleResolver({ locale: publicLocale() }),
    clientFeatures: [{ name: "show-pony-public", translations: showPonyTranslationsByLocale }],
  });
}
