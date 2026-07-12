import { escapeHtml } from "@cosmicdrift/kumiko-headless";
import type { Lang } from "./layouts/shared";

export const ICON = {
  calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4M16 4v4M4 11h16"/>',
  users:
    '<path d="M17 19a4 4 0 0 0-8 0"/><circle cx="13" cy="9" r="3"/><path d="M21 19a3 3 0 0 0-2.8-2M16 5.2a3 3 0 0 1 0 5.6"/>',
  mail: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="m3 8 9 6 9-6"/>',
  link: '<path d="M10 14a4 4 0 0 1 0-6l2-2a4 4 0 0 1 6 6l-1 1"/><path d="M14 10a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-6-6l1-1"/>',
  shield: '<path d="M12 3 20 7v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
} as const;

type FeatureCopy = { readonly title: string; readonly desc: string; readonly detail: string };

type GridEntry = { readonly icon: string; readonly de: FeatureCopy; readonly en: FeatureCopy };

const GRID_DE: readonly GridEntry[] = [
  {
    icon: ICON.calendar,
    de: {
      title: "Events in Minuten",
      desc: "Datum, Ort, Beschreibung — fertig zum Teilen.",
      detail:
        "Lege ein Event an, passe Copy und RSVP-Felder an und veröffentliche mit einem Klick.",
    },
    en: {
      title: "Events in minutes",
      desc: "Date, venue, description — ready to share.",
      detail: "Create an event, tune copy and RSVP fields, publish in one click.",
    },
  },
  {
    icon: ICON.link,
    de: {
      title: "Eigene Subdomain",
      desc: "demo.show-pony.kumiko.rocks/e/rooftop-launch",
      detail:
        "Jeder Host bekommt eine Tenant-Subdomain — Gäste sehen nur dein Branding, nicht das Admin-Login.",
    },
    en: {
      title: "Your own subdomain",
      desc: "demo.show-pony.kumiko.rocks/e/rooftop-launch",
      detail: "Each host gets a tenant subdomain — guests see your invite, not the admin login.",
    },
  },
  {
    icon: ICON.users,
    de: {
      title: "Gästeliste live",
      desc: "RSVPs landen sofort in der Host-Ansicht.",
      detail: "Ja/Nein/Vielleicht, optionale Felder und Export — alles tenant-scoped.",
    },
    en: {
      title: "Live guest list",
      desc: "RSVPs show up instantly in the host view.",
      detail: "Yes/no/maybe, optional fields and export — all tenant-scoped.",
    },
  },
  {
    icon: ICON.mail,
    de: {
      title: "Bestätigungs-Mail",
      desc: "Gäste bekommen direkt nach dem RSVP eine Mail.",
      detail:
        "In der Demo läuft der Versand in-memory; Prod kann SMTP tauschen ohne Code-Änderung.",
    },
    en: {
      title: "Confirmation email",
      desc: "Guests receive mail right after RSVP.",
      detail: "Demo uses in-memory transport; production can swap SMTP without code changes.",
    },
  },
  {
    icon: ICON.shield,
    de: {
      title: "Multi-Tenant by design",
      desc: "Host-Login auf dem Apex, Gäste auf Subdomains.",
      detail: "Anonyme Writes sind host-gebunden — kein Tenant-Forging aus dem Payload.",
    },
    en: {
      title: "Multi-tenant by design",
      desc: "Host login on apex, guests on subdomains.",
      detail: "Anonymous writes bind to the Host header — no tenant forging from payloads.",
    },
  },
  {
    icon: ICON.globe,
    de: {
      title: "DE + EN",
      desc: "Marketing, Legal und Tutorial spiegeln beide Sprachen.",
      detail: "Locale-Routing auf dem Apex; die App nutzt i18next wie jede Kumiko-App.",
    },
    en: {
      title: "DE + EN",
      desc: "Marketing, legal and tutorial mirror both languages.",
      detail: "Locale routing on apex; the app uses i18next like any Kumiko app.",
    },
  },
] as const;

export type GridFeature = {
  readonly icon: string;
  readonly title: string;
  readonly desc: string;
};

export type DetailFeature = {
  readonly title: string;
  readonly detail: string;
  readonly shot?: string;
};

export function gridFeatures(lang: Lang): readonly GridFeature[] {
  return GRID_DE.map((f) => {
    const copy = lang === "en" ? f.en : f.de;
    return { icon: f.icon, title: copy.title, desc: copy.desc };
  });
}

export function detailFeatures(lang: Lang): readonly DetailFeature[] {
  return [
    {
      title: lang === "de" ? "Host-Dashboard" : "Host dashboard",
      detail:
        lang === "de"
          ? "Events anlegen, Gäste filtern, Demo-Modus erkennen — alles hinter /login auf dem Apex."
          : "Create events, filter guests, spot demo mode — all behind /login on the apex.",
      shot: "events-dashboard",
    },
    {
      title: lang === "de" ? "Öffentliche Invite-Seite" : "Public invite page",
      detail:
        lang === "de"
          ? "Schöne RSVP-Oberfläche auf der Tenant-Subdomain — ohne Account für Gäste."
          : "Polished RSVP surface on the tenant subdomain — no account required for guests.",
      shot: "public-rsvp",
    },
    {
      title: lang === "de" ? "Platform-Workspace" : "Platform workspace",
      detail:
        lang === "de"
          ? "Sysadmin sieht Tenants und User — Tutorial-Kapitel zeigt den zweiten Account."
          : "Sysadmin sees tenants and users — the tutorial chapter shows the second account.",
      shot: "platform-overview",
    },
  ];
}

export function tutorialLinksHtml(lang: Lang): string {
  const base = "https://docs.kumiko.rocks/en/show-pony";
  const items =
    lang === "de"
      ? [
          { href: `${base}/`, label: "Tutorial-Start" },
          { href: `${base}/04-apex-and-subdomains/`, label: "Apex & Subdomains" },
          { href: `${base}/11-seed-and-deploy/`, label: "Seed & Deploy" },
        ]
      : [
          { href: `${base}/`, label: "Tutorial start" },
          { href: `${base}/04-apex-and-subdomains/`, label: "Apex & subdomains" },
          { href: `${base}/11-seed-and-deploy/`, label: "Seed & deploy" },
        ];
  const lis = items
    .map((i) => `<li><a href="${escapeHtml(i.href)}">${escapeHtml(i.label)}</a></li>`)
    .join("");
  return `<ul class="tutorial-links">${lis}</ul>`;
}


