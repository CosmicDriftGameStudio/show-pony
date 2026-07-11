// Public page mount — imported by the client-public.tsx bundle, which the
// server delivers via hostDispatch to every tenant subdomain. One route:
// the event page (slug from the URL). No react-router needed.

import { createStaticLocaleResolver, LocaleProvider } from "@cosmicdrift/kumiko-renderer";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { showPonyTranslationsByLocale } from "../features/show-pony/i18n";
import { EventPage } from "./EventPage";

function publicLocale(): string {
  const lang = navigator.language.split("-")[0] ?? "en";
  return lang === "de" ? "de" : "en";
}

export function mountPublic(): void {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("[show-pony] #root not found in DOM");
  createRoot(rootEl).render(
    <StrictMode>
      <LocaleProvider
        resolver={createStaticLocaleResolver({ locale: publicLocale() })}
        fallbackBundles={[showPonyTranslationsByLocale]}
      >
        <EventPage />
      </LocaleProvider>
    </StrictMode>,
  );
}
