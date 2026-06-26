// Screenshot-Szenarien für das Tutorial. Jeder Eintrag = ein PNG. Die
// Dashboard-Pages laufen authed (storageState); die public Event-Page
// anonym (clearAuth → frische Cookies, der Host-Login leakt nicht auf die
// Gast-Seite).

import { DEMO_SLUG, publicEventUrl } from "./constants";

export interface Scenario {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly waitFor: string;
  readonly settleMs?: number;
  readonly clearAuth?: boolean;
}

export const SCENARIOS: readonly Scenario[] = [
  {
    name: "host-events",
    description: "Host-Dashboard — Event-Liste, schema-driven aus der Entity gerendert",
    url: "/event-list",
    waitFor: "table tbody tr",
    settleMs: 400,
  },
  {
    name: "host-event-form",
    description: "Event anlegen — auto-generiertes Formular mit Sections + Feldern",
    url: "/event-edit",
    waitFor: "form input",
    settleMs: 400,
  },
  {
    name: "host-guests",
    description: "Gästeliste — die anonym eingegangenen RSVPs, tenant-scoped",
    url: "/rsvp-list",
    waitFor: "table tbody tr",
    settleMs: 400,
  },
  {
    name: "public-event",
    description: "Public Event-Page — anonymer Gast sieht das Event + RSVP-Formular",
    url: publicEventUrl(DEMO_SLUG),
    waitFor: "form",
    settleMs: 400,
    clearAuth: true,
  },
];
