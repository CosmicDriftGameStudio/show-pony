# show-pony

Guest list / event RSVP — a **Kumiko sample app**. Public name: **ShowPony**.

**Pitch:** *Make an event. Share the link. See who's coming.* — kein Account nötig zum Zusagen.

> **Status:** M0 — docs & planning only. No app code yet.
> **Primary goal:** public `doc → code → app` reference build für Kumiko. Echte User = Bonus, kein Kill-Gate.

## Hosting

Doc-forced — läuft erstmal auf einer **kumiko-Subdomain** (`show-pony.kumiko.rocks`),
keine Standalone-Domain. `.com` + USPTO-Check erst, wenn aus dem Sample ein echtes Produkt wird.

## The spine (warum es ein gutes Sample ist)

```
Host erstellt Event → public Link → anonyme Gäste tragen sich ein → Host sammelt/notified/exportiert
```

~Alles davon ist Kumiko-Bordmittel (siehe `docs/plans/product-scope.md`). **Eine echt neue
Capability: keine.** Dieselbe Spine ergibt mit anderer Haut eine **Waitlist** oder
**Sign-up-Sheets** — das ist die Teaching-Story der Docs, nicht ein generischer Combiner.

## Scope (explizite Non-Goals)

- Kein Ticketing / bezahlte Events (Stripe Checkout) — evtl. später
- Kein Full-Event-Management (Sitzplan, Vendors, Budget)
- Kein Kalender-Sync — `.ics`-Link statt Sync
- Keine Native-Apps — Gast braucht nur den Link, kein Account

## Docs

| Path | Content |
|---|---|
| `docs/plans/product-scope.md` | Features, Tiers, Kumiko-Fit (✅/🔶/❌) |

Die eigentliche Doku entsteht später als Embed-Kapitel **aus dem Code** (`kumiko docgen` +
`file=`-Embeds, CI-guarded gegen Drift) — nicht als Plan-Prosa jetzt.

## Portfolio

| App | Role |
|---|---|
| Kumiko | Platform |
| Cashcolt (`money-horse`) | Consumer finance anchor |
| publicstatus | Dev/status showcase |
| solon | DACH landlord (planned) |
| **show-pony** | Public Kumiko sample: guest list / RSVP |

## Next milestone

M1: MVP live auf kumiko-Subdomain (Event → public RSVP-Page → Gästeliste + Confirmation),
dann ein echtes Event durchspielen → erstes Doc-Kapitel aus dem Code.
