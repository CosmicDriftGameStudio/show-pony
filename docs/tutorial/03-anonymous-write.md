# Der Kern — anonyme, multi-tenant Writes

Ein Gast ohne Account sagt zu, und die RSVP landet **deterministisch** beim
richtigen Host. Das ist die Lücke, die show-pony als Sample füllt: Kumikos
`anonymous-access`-Recipe zeigt anonymen Write *single-tenant* — hier ist er
*multi-tenant*, der Tenant kommt aus der URL.

## Die zwei Hälften

**1. Der Handler darf anonym sein.** `roles: [...access.anonymous]` lässt
unauthentifizierte Caller durch — das Framework synthetisiert einen
`SessionUser` mit `id="anonymous"`. Ein striktes Zod-Schema whitelistet
exakt die Felder, die ein Gast setzen darf.

```ts
r.writeHandler(
  "rsvp:submit",
  rsvpSubmitSchema,
  async (event, ctx) => rsvpExecutor.create(event.payload, event.user, ctx.db),
  {
    access: { roles: [...access.anonymous] },
    rateLimit: { per: "ip+handler", limit: 20, windowSeconds: 60 },
  },
);
```

Das **Rate-Limit per `ip+handler` ist Pflicht**, nicht Deko: alle anonymen
Caller teilen `user.id="anonymous"`. Ein per-User-Limit wäre ein einziger
globaler Tap, den jeder Caller leeren könnte — der Kumiko-Boot-Validator
lehnt diese Fehlkonfiguration ab.

**2. Der Tenant kommt aus der Subdomain, nicht aus dem Payload.** Das ist die
entscheidende Designentscheidung. Der anonyme POST geht an
`acme.show-pony.kumiko.rocks/api/write`. Der `tenantResolver` liest den
**Host-Header** der Request-Envelope und mappt `acme` → `tenant.key` → `tenantId`:

```ts
export function createShowPonyTenantResolver(config: { db: DbConnection; baseDomain: string }) {
  const { db, baseDomain } = config;
  return {
    tenantResolver: async (c) => {
      const host = hostnameOf(c.req.header("Host") ?? "");
      if (host === baseDomain || host === `www.${baseDomain}`) return null; // Apex: kein Tenant
      if (host.endsWith(`.${baseDomain}`)) {
        return enabledTenantByKey(db, host.slice(0, -(baseDomain.length + 1)));
      }
      return null;
    },
    tenantExists: (id) => isTenantEnabled(db, id), // defense-in-depth gegen X-Tenant-Spoofing
  };
}
```

Warum nicht der Payload? Weil der `tenantResolver` *vor* dem Handler läuft und
nur die Request-Envelope sieht (Host-Header), nicht den Body. Wir nutzen die
bundled `tenant.key` direkt als Subdomain — kein eigenes Profil-Schema nötig.

## Verdrahtung beim Boot

`bin/server.ts` gibt die Factory-Form an `runDevApp` — die bekommt die `db`
und baut den Resolver:

```ts
anonymousAccess: ({ db }) => createShowPonyTenantResolver({ db, baseDomain: BASE_DOMAIN }),
```

## Bewiesen — gegen den echten Resolver

Der Integrationstest fährt **denselben** Resolver wie der Boot
(`createShowPonyTenantResolver`) gegen echte, geseedete tenant-Rows — kein
Mock. Vier Eigenschaften:

1. RSVP an `acme.show-pony.test` landet in Tenant Acme, an `globex…` in Globex
   — jeder Host sieht über die tenant-scoped Gästeliste nur den eigenen Gast.
2. Unbekannte Subdomain → `400 tenant_required` (Resolver gibt `null`).
3. Gefälschter `X-Tenant`-Header → `404 tenant_not_found` (`tenantExists`
   weist die unbekannte id ab — der defense-in-depth-Guard).
4. Host-CRUD (`event:create`) weist anonyme Caller mit `403` ab.

```bash
bun --env-file=../.env test src/__tests__/rsvp-anonymous.integration.test.ts
# 4 pass
```

> **Warum der echte Resolver, nicht ein Mock?** Ein Mock-Resolver würde nur
> die Framework-Pipeline testen, nicht den `tenant-routing.ts`-Code, den der
> Server tatsächlich bootet. Der Resolver ist das wiederverwendbare Artefakt,
> das dieses Sample lehrt — ihn ungetestet zu shippen würde ein Pattern
> vorführen, das niemand verifiziert hat.

Mit dem bewiesenen Kern steht das Fundament. Was fehlt, sind die beiden
sichtbaren Seiten derselben Engine — das Host-Dashboard und die public
Event-Page.
