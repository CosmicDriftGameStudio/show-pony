# Die Bestätigungs-Mail — mail-foundation für anonyme Empfänger

Gibt der Gast eine Email an, soll er eine Bestätigung bekommen. Naheliegend
wäre Kumikos `delivery`-Feature — aber das ist **user-zentriert**: der
Empfänger ist eine `userId`, die zu einer Email aufgelöst wird. Unser Gast
hat keinen Account. Er ist anonym und einzig über die Email adressierbar, die
er gerade ins Formular getippt hat.

Für genau diesen Fall sagt die Doku: `mail-foundation` direkt nutzen, wenn die
`delivery`-Channels nicht passen. Das ist die Ebene unter `delivery` — ein
Transport, an den man eine fertige Email gibt.

## Mounten

Zwei Features in die Komposition: die Foundation + ein Transport. Im Sample
der inmemory-Transport (Inbox via `getInbox`), ein echter SMTP-Transport ist
ein Deploy-Swap, kein Code-Change:

```ts
export const APP_FEATURES = [
  mailFoundationFeature,
  mailTransportInMemoryFeature,
  showPonyFeature,
] as const;
```

Ein Stolperstein: `mail-foundation` verlangt einen ausgewählten Provider —
auch bei nur einem Transport gibt es keinen stillen Default (besser als
heimlich die falsche Mail zu schicken). Den Provider setzen wir app-weit per
`appOverride`, damit nicht jeder Tenant ihn erst konfigurieren muss:

```ts
const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});
```

## Senden — best-effort

Im `rsvp:submit`-Handler, nach dem Anlegen der RSVP: nur wenn eine Email da
ist, den Tenant-Transport holen und senden. Wichtig — **die Mail darf die
RSVP nicht kippen**: ein Transport-Fehler wird geschluckt, der Gast ist
eingetragen.

```ts
async (event, ctx) => {
  const result = await rsvpExecutor.create(event.payload, event.user, ctx.db);
  await sendRsvpConfirmation(ctx, event.user.tenantId, event.payload).catch(() => undefined);
  return result;
};
```

`sendRsvpConfirmation` schlägt den Event-Titel nach (für die Betreffzeile)
und ruft `createTransportForTenant(ctx, tenantId, …)` → `transport.send(…)`.
Der Tenant kommt aus `event.user.tenantId` — beim anonymen Gast ist das der
über die Subdomain aufgelöste Host-Tenant. Die Mail landet also im richtigen
Tenant-Buffer.

## Bewiesen — über den Inbox

Der inmemory-Transport puffert Mails pro Tenant; `getInbox(tenantId)` liest
sie. Der Integrationstest fährt einen anonymen RSVP mit Email und prüft:

```bash
bun --env-file=../.env test src/__tests__/rsvp-anonymous.integration.test.ts
# 6 pass — u.a.: Mail landet im richtigen Tenant-Inbox, keine Mail ohne Email
```

> Der **New-RSVP-Alert an den Host** ist die Kehrseite und kommt als eigener
> Schritt: er braucht die Host-Email aus dem Tenant (Owner-Lookup), nicht nur
> die Payload.
