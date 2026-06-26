---
status: in-progress
verified: 2026-06-22
next: M1 — MVP (Event → public RSVP-Page → Gästeliste + Confirmation) live auf kumiko-Subdomain
---

# Product scope — guest list / RSVP

Schmal. Eine Engine, eine Haut. Status = Kumiko Bordmittel vs. App-Glue vs. echtes ❌ neu.

> **Name:** ShowPony · Repo `show-pony`. Standalone-Domain + USPTO erst, wenn aus dem Sample ein Produkt wird.

## Public scope — die strategische Achse

Gleiche Engine, zwei Skins mit sehr unterschiedlicher Reichweite:

- **Private Events** (Party, Dinner): narrowcast — Link an bekannte Leute, kein Discovery/SEO. Dünner public scope.
- **Öffentliche / Community-Events** (Meetup, Workshop, Popup — Luma-Modell): broadcast, an Fremde promotet, Discovery-Surface. Großer public scope.

**Für easy-users/Reichweite → lean auf public/community events.** Beeinflusst Naming + Copy, nicht den Code.

**Legende**

| Status | Meaning |
|---|---|
| ✅ | Kumiko / Plattform vorhanden |
| 🔶 | App: Entities, UI, Config, Templates |
| ❌ | Neue Capability (nicht „noch eine Tabelle") |

## Sende-Modell (MVP)

Wir versenden **keine** Invites. Host teilt den Link selbst (Copy → WhatsApp/Slack/Insta) —
das geteilte Link *ist* der Viral-Loop. Wir mailen nur: Confirmation an Gast, Reminder vor
dem Event, New-RSVP-Alert an Host. Bulk-Invite-Versand (Liste hochladen → wir mailen) = phase 2.

## Features

| Feature | Tier | Status |
|---|---|---|
| Account, login, tenant (= Host) | — | ✅ |
| App subscription Free/Pro | — | ✅ `subscription-stripe` |
| Legal pages (app) | — | ✅ `legal-pages` |
| Host profile (name, optional logo) | Free / Pro | 🔶 |
| Event (title, date/time, location, description, cover) | Free | 🔶 |
| Public event page (render + RSVP-Form) | Free | 🔶 public surface + anonymer Write |
| RSVP (name Pflicht, email **optional**, +N Begleitung, Notiz) | Free | 🔶 via public-write |
| RSVP-Status yes / no / maybe | Free | 🔶 |
| „X going" Count | Free | 🔶 trivial |
| `.ics` „Add to Calendar"-Link | Free | 🔶 trivial (native, kein Signing) |
| Guest cap (max Gäste pro Event) | Free / Pro | ✅ `cap-counter` |
| Confirmation-Email an Gast (wenn email da) | Free | ✅ `delivery` + mail |
| New-RSVP-Alert an Host | Free | ✅ `delivery` |
| Reminder vor dem Event (z.B. Vortag) | Pro | ✅ `jobs` + `delivery` |
| Guest-list Dashboard + Count-Badges | Free | 🔶 entityList |
| CSV-Export | Pro | 🔶 |
| Branding entfernen / Custom-Cover | Pro | 🔶 config + template + `files` |
| Free-Caps (Events/Monat, Gäste/Event) | Free / Pro | ✅ `cap-counter` |
| Custom domain | Pro (phase 2) | ✅ publicstatus-Pattern (`lookupTenantByCustomDomain`) |
| GDPR (Gast-PII, unsubscribe) | — | ✅ platform default (`delivery` unsubscribe-token) |

**Echt neu fürs Framework: ❌ keins — verifiziert.** Anonymer Write existiert sauber:
`roles: ["anonymous"]` am WriteHandler + `anonymousAccess` beim Boot
(`packages/framework/src/engine/access.ts`). Recipe `samples/recipes/anonymous-access` zeigt
`guest-order:place` (anonymer Create + per-IP-Rate-Limit) — fast 1:1 unser RSVP. Per-Event-Tenant
kommt aus der public URL via `tenantResolver` (multi-tenant, wie publicstatus custom-domain).
**Kein dediziertes RSVP/anonymous-multi-tenant-write-Sample existiert — genau die Lücke, die show-pony füllt.**

## Marketing tiers

| | Free | Pro (~$X/mo) |
|---|---|---|
| Events / Monat | 1–3 | Unlimited |
| Public RSVP-Page + `.ics` + Confirmation | ✅ | ✅ |
| Reminder vor dem Event | ❌ | ✅ |
| Branding entfernen / Custom-Cover | ❌ | ✅ |
| CSV | ❌ | ✅ |
| Custom domain | ❌ | ✅ (phase 2) |

GDPR / EU-Hosting: platform default — kein Tier-Feature.

## Analytics

Winzig — event-sourced, Counts fallen natürlich ab. **MVP = die Count-Badges am Dashboard**
(# going / maybe / no, Gesamt-Köpfe inkl. +N). Echte Analytics (Page-Views, Quellen,
Conversion, RSVP-über-Zeit) = phase 2, kleiner `jobs`-Rollup, niedrige Prio. Kein Analytics-Produkt.

## Phases

1. **MVP:** Event → public RSVP-Page → yes/no/maybe (name Pflicht, email optional) → Gästeliste + Count → Confirmation + Host-Alert → `.ics` + CSV. Kein Reminder, keine Custom-Domain.
2. **Pro:** Reminder (`jobs`) + Cap-Lift + Branding/Cover + Custom-Domain + Bulk-Invite-Versand + echte Analytics.
3. **Check-in-Bundle (gekoppelt):** Host hakt Namen am Eingang ab (🔶, kein Scanner) → *erst dann* lohnt QR + Apple/Google-Wallet-Pass (das eine echte ❌). Nur für Events mit Tür-Kontrolle.
4. **Schwester-Samples (gleiche Spine):** Waitlist-Haut · Sign-up-Sheets („wer bringt was", Slots = `cap-counter`) · Referral/Position.

## Explicitly out

- Ticketing / bezahlte Events (Stripe Checkout)
- Apple/Google-Wallet-Passes — nur sinnvoll *mit* Check-in (phase 3), sonst `.ics` reicht
- Full-Event-Management (Sitzplan, Vendors, Budget)
- Kalender-Sync (Google/Apple) — `.ics`-Link statt Sync
- Native-Apps — Gast braucht nur den Link, kein Account
- Generischer „collect-anything"-Builder (= Form-Builder = Scope-Tod)
