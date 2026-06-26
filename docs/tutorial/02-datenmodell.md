# Schritt 2 — Datenmodell: das RSVP

> Ziel: die zweite Hälfte des Datenmodells. Ein `rsvp`-Entity, das die
> Zu-/Absagen aufnimmt, plus host-seitige Read-Handler für die Gästeliste.

## Das `rsvp`-Entity

```ts
export const RSVP_STATUSES = ["yes", "no", "maybe"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const rsvpEntity = createEntity({
  fields: {
    eventId: createTextField({ required: true, searchable: true }),
    name: createTextField({ required: true, sortable: true, searchable: true }),
    email: createTextField({ searchable: true }),
    status: createSelectField({ options: RSVP_STATUSES, default: "yes", filterable: true }),
    plusN: createNumberField({ sortable: true }),
    note: createLongTextField(),
  },
});
```

## Die Feld-Entscheidungen

- **`name` Pflicht, `email` optional.** Der Gast soll mit einem Klick
  zusagen können. Email verlangen wir nur, wenn der Gast eine
  Bestätigungs-Mail will — kein Account, kein Login, keine Hürde. Genau das
  macht die public-Page viral.
- **`status` als Enum, nicht Boolean.** Zusage / Absage / Vielleicht. Das
  „Vielleicht" ist bei Events real und gehört ins Modell, nicht in einen
  Kommentar. `RSVP_STATUSES` ist die eine Quelle — Handler-Validierung und
  UI ziehen denselben Tuple.
- **`plusN` = Begleitpersonen.** „Ich komme mit 2 Freunden" → `plusN: 2`.
  Die Gesamtköpfe sind dann `1 + plusN`. Das hält das Modell flach (keine
  zweite Gäste-Tabelle), deckt aber den 90%-Fall ab.
- **`eventId` referenziert innerhalb des Tenants.** Kein globaler FK — das
  Event lebt im selben Tenant wie die RSVP (Tenant-Scoping garantiert das).
  Ein Text-Feld mit der Event-UUID reicht; eine echte Relation kann später
  dazukommen, wenn wir sie brauchen.

## Host-Read-Handler

Das Entity registrieren wir mit Read-Handlern — der Host muss die
Gästeliste sehen. Den **Write** lassen wir hier bewusst weg: RSVPs kommen
nicht vom Host, sondern vom anonymen Gast über die public-Page. Das ist der
nächste Schritt.

```ts
r.entity("rsvp", rsvpEntity);
r.queryHandler(defineEntityListHandler("rsvp", rsvpEntity, hostAccess));
r.queryHandler(defineEntityDetailHandler("rsvp", rsvpEntity, hostAccess));
```

Stand: Datenmodell komplett (`event` + `rsvp`), Host kann beide lesen.
Als Nächstes der Kern von show-pony — der **anonyme, multi-tenant
RSVP-Write**.
