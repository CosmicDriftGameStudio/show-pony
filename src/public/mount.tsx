// Public page mount — imported by the client-public.tsx bundle, which the
// server delivers via hostDispatch to every tenant subdomain. One route:
// the event page (slug from the URL). No react-router needed.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EventPage } from "./EventPage";

export function mountPublic(): void {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("[show-pony] #root not found in DOM");
  createRoot(rootEl).render(
    <StrictMode>
      <EventPage />
    </StrictMode>,
  );
}
