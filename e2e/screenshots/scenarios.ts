// Screenshot scenarios for the tutorial. Each entry = one PNG. Dashboard
// pages run authed (storageState); the public event page runs anonymous
// (clearAuth → fresh cookies, the host login does not leak to the guest page).

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
    url: "/host/event-list",
    waitFor: "text=Rooftop Launch Party",
    settleMs: 400,
  },
  {
    name: "host-event-form",
    description: "Event anlegen — auto-generiertes Formular mit Sections + Feldern",
    url: "/host/event-edit",
    waitFor: "form input",
    settleMs: 400,
  },
  {
    name: "host-guests",
    description: "Gästeliste — die anonym eingegangenen RSVPs, tenant-scoped",
    url: "/host/rsvp-list",
    waitFor: "text=Ava Chen",
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



