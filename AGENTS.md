# ShowPony: agent instructions

ShowPony is built on Kumiko. The framework guide for coding agents ships with the installed package and matches its version:

- `node_modules/@cosmicdrift/kumiko-framework/AGENTS.md`: start here.
- `node_modules/@cosmicdrift/kumiko-framework/agents/`: generated indexes of bundled features, widgets and tested examples.

Read the framework guide before you add or change a feature. The sections below are specific to this app.

## Product

- Purpose: a lightweight guest list / event RSVP app and Kumiko reference sample. A host creates an event and shares one link; guests reply anonymously on a public page; the host watches the guest list fill up.
- Production URL: https://show-pony.kumiko.rocks (read-only demo, reset by wiping the demo DB)

## Mounted features

Composed in `src/run-config.ts` (`buildAppFeatures`):

- App features: `show-pony` (events, RSVPs, billing plan catalog) and `app-shell` in `src/features/`.
- Bundled: auth-foundation, host-routing (tenant by subdomain), legal-pages (imprint, privacy, terms), managed-pages, delivery, channel-email (in-memory transport), jobs, tier-engine, compliance-profiles, tenant-lifecycle, secrets, metrics, readiness (system check for SystemAdmin in the platform workspace only, show-pony has no tenant probes), admin-shell, the security stack (sessions, crypto-shredding, rate-limiting, audit), the renderer stack and the German locale.

Mount more in `src/run-config.ts`. App code lives in `src/features/<name>/`.

## Commands

| Command | What it does |
|---|---|
| `docker compose up -d` | local Postgres, Redis and Meilisearch (port 17700) |
| `bun dev` | run the app on `show-pony.localhost:4180` |
| `bun start` | prod boot (`bin/main.ts`); env contract in `bin/env-schema.ts`, local values in `.env.example` |
| `bun run typecheck` | `tsc` for the app and `e2e/` |
| `bun run lint` | Biome |
| `bun run check` | Kumiko guards, schema and upgrade-state checks |
| `bun run test` | unit tests |
| `bun run test:integration` | integration tests against a real Postgres |
| `bun run e2e` | Playwright end-to-end flows |
| `bun kumiko ops backfill-pii` | one-off after the first deploy with a real KMS (prod boots with plaintext PII) |
| `bun kumiko-upgrade --apply` | framework codemods after a version bump; resolve open entries with `--resolve` |

## App-specific rules

- ShowPony is a throwaway demo and tutorial, not a long-lived tenant database. Prod demo data is a resettable fixture: edit the single demo seed `seeds/2026-06-28-demo-event-rsvps.ts` and reset the demo DB; do not stack dated repair seeds.
- Boot seeds must never throw. `seedsDir: "./seeds"` runs on every prod pod start, so a failing seed is a crash loop (`src/__tests__/seed-boot-safety.test.ts`).
- `bun dev` skips `seedsDir`. Before shipping seed changes run `bin/main.ts` against Docker Postgres.
- The host is decided by the subdomain a request arrives on, never by anything the guest sends. Keep anonymous writes (`rsvp:submit`) tenant-scoped through the `host-routing` feature (`showPonyHostRoutingOptions` in `src/tenant-routing.ts`).
- Never patch the cluster or rollout strategy to get past a boot failure; fix the seed or code and ship it through a PR.
