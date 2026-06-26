# Das Skelett — ein Kumiko-Sample von Grund auf

show-pony ist ein eigenständiges App-Repo gegen das publishte Kumiko
(`^0.87.2`) — genau wie `publicstatus` und `money-horse`. Bevor es eine UI
oder eine public-Page gibt, steht das Backend: ein Feature mit einem
`event`-Entity. Acht Dateien, mehr braucht ein lauffähiges Kumiko-Repo nicht:

| Datei | Zweck |
|---|---|
| `package.json` | npm-Refs auf `@cosmicdrift/kumiko-*`, `bun dev`-Script |
| `tsconfig.json` / `biome.json` | strict TS + House-Style-Lint |
| `.gitignore` / `.env.example` | Standard + die zwei Env-Vars ohne sicheren Default |
| `bin/server.ts` | dev-server: `runDevApp` + ein Demo-Host-Tenant + Admin-Login |
| `src/run-config.ts` | Single source of truth der Feature-Komposition |
| `src/feature.ts` | das `showpony`-Feature: `event`-Entity + Handler |

## Das Feature

Ein Feature definiert Entity + Handler. Kein manuelles Executor-Wiring —
`defineEntityCreateHandler` & Co. generieren die CRUD-Handler direkt aus der
Entity-Definition:

```ts
export const eventEntity = createEntity({
  fields: {
    title: createTextField({ required: true, sortable: true, searchable: true }),
    slug: createTextField({ required: true, searchable: true }),
    startsAt: createTzField({ required: true }),
    location: createTextField({ searchable: true }),
    description: createLongTextField(),
    guestLimit: createNumberField({ sortable: true }),
  },
});

const hostAccess = { access: { openToAll: true } } as const;

export const showPonyFeature = defineFeature("showpony", (r) => {
  r.entity("event", eventEntity);
  r.writeHandler(defineEntityCreateHandler("event", eventEntity, hostAccess));
  r.writeHandler(defineEntityUpdateHandler("event", eventEntity, hostAccess));
  r.writeHandler(defineEntityDeleteHandler("event", eventEntity, hostAccess));
  r.queryHandler(defineEntityListHandler("event", eventEntity, hostAccess));
  r.queryHandler(defineEntityDetailHandler("event", eventEntity, hostAccess));
});
```

Die Komposition lebt in `src/run-config.ts`. `HAS_AUTH = true` zieht die
bundled Auth-Kette (config/user/tenant/auth-email-password/secrets)
automatisch dazu; wir mounten nur das eigene Feature:

```ts
export const APP_FEATURES = [showPonyFeature] as const;
export const HAS_AUTH = true;
```

## Zwei Entscheidungen, die das Schema festlegen

**`openToAll` für Host-CRUD ist sicher.** `openToAll` heißt „jeder
eingeloggte User" — aber Writes und Queries sind tenant-scoped. Ein Host
sieht und ändert nur die Events des eigenen Tenants, nie die eines fremden.
Die Isolation kommt aus dem Framework, nicht aus einer Rollen-Prüfung.

**Der Event-Slug ist per-Tenant eindeutig, nicht global.** Die public URL
wird `<host>.show-pony.kumiko.rocks/e/<slug>`. Der Host kommt aus der
**Subdomain** (Host-Header), nicht aus dem URL-Pfad — das gibt der Kumiko-
`tenantResolver`-Vertrag so vor (er liest `req.header("Host")`). Damit muss
der Slug nur innerhalb eines Tenants kollisionsfrei sein. Diese Entscheidung
fällt hier, weil sie das Entity-Feld bestimmt — nicht erst, wenn der anonyme
Write dazukommt.

## Lokal laufen lassen

show-pony liegt als Sibling neben `publicstatus`/`money-horse` und löst die
kumiko-Pakete über die Parent-Workspace-Symlinks (lokaler Checkout) auf.

```bash
cd show-pony
bun run typecheck   # grün
bun dev             # http://localhost:4180 — braucht Postgres + Redis (parent .env)
                    # Login: admin@show-pony.local / changeme
```

Die API bootet, `event`-CRUD läuft über `/api/write` und `/api/query`. Das
sichtbare Host-Dashboard entsteht später aus denselben Entity-Definitionen.
