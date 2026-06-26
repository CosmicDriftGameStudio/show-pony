// Public-Page-Mount — vom client-public.tsx Bundle importiert, das der
// Server via hostDispatch auf jede Tenant-Subdomain ausliefert. Eine Route:
// die Event-Page (Slug aus der URL). Kein react-router nötig.

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
