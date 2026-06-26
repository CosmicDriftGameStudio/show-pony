# Die public Event-Page — die anonyme Gast-Seite

Das Host-Dashboard ist das eine Gesicht der App, der Gast sieht das andere:
eine öffentliche Seite pro Event, ohne Login, ohne Account. Sie lädt das
Event über seinen Slug und zeigt das RSVP-Formular. Genau hier wird der
anonyme, multi-tenant Write sichtbar.

## Zwei Bundles, server-seitig geroutet

Der Host und der Gast laden **nicht** dasselbe JavaScript. Der Server
entscheidet per Host-Header, welches Bundle ausgeliefert wird:

```ts
clientEntries: [
  { name: "admin", sourceFile: "./src/client.tsx", htmlPath: "./public/index.html" },
  { name: "public", sourceFile: "./src/client-public.tsx", htmlPath: "./public/public.html" },
],
hostDispatch: (req) => {
  const host = hostnameOf(req.headers.get("host") ?? "");
  if (host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`) {
    return { kind: "html", entryName: "admin", injectSchema: true };
  }
  return { kind: "html", entryName: "public", injectSchema: false };
},
```

Apex (`show-pony.kumiko.rocks`) → das Host-Dashboard, mit injiziertem Schema
für die Screens. Jede Subdomain (`acme.show-pony.kumiko.rocks`) → das
public-Bundle. Der Gast lädt nie den Admin-Code, der Host nie umgekehrt.
**Der Server routet, nicht der Browser** — ein Browser-Hostname-Check wäre
fragil.

## Der anonyme Fetch

Das public-Bundle spricht denselben Dispatcher wie alles andere — nur ohne
Token. Anonyme Requests tragen keine Auth-Cookie, also überspringt der
CSRF-Guard die Prüfung. Ein einfacher POST genügt:

```ts
export async function submitRsvp(input: RsvpInput): Promise<SubmitResult> {
  const res = await fetch("/api/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "showpony:write:rsvp:submit", payload: input }),
  });
  ...
}
```

Den Tenant schickt der Client **nicht** mit — der `tenantResolver` leitet ihn
aus der Subdomain ab (Host-Header). Derselbe Code auf `acme.…` schreibt nach
Acme, auf `globex.…` nach Globex.

## Das Event lesen — anonym, tenant-scoped

Die Seite braucht das Event. Dafür gibt es eine anonyme Query, die den Slug
auf ein Event im aufgelösten Tenant abbildet:

```ts
r.queryHandler(
  "event:bySlug",
  z.object({ slug: z.string().min(1).max(120) }),
  async (e, ctx) => {
    const events = await ctx.db.selectMany(eventTable);
    return events.find((row) => row.slug === e.payload.slug) ?? null;
  },
  { access: { roles: [...access.anonymous] } },
);
```

`ctx.db` ist bereits auf den Subdomain-Tenant gescoped — ein Slug, der auf
einer anderen Subdomain existiert, ist hier unsichtbar.

## Das Formular

`RsvpForm` ist ein gewöhnliches React-Formular: Name (Pflicht), Status
(komme / vielleicht / kann nicht), Begleitung, E-Mail (optional). `onSubmit`
ruft `submitRsvp` und zeigt inline den Success-State — kein Redirect, kein
Reload. Ein Klick, fertig. Genau diese Reibungslosigkeit ist der Viral-Loop:
der geteilte Link *ist* die Einladung.

Damit ist die minimale Einheit komplett: Host legt ein Event an (Dashboard),
teilt den Subdomain-Link, der Gast sagt anonym zu, der Host sieht die
Gästeliste. Eine Engine, zwei Gesichter.
