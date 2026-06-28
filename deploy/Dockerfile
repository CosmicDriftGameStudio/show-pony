# syntax=docker/dockerfile:1.23
#
# Production image for show-pony.
#
# Server-bundle variant — the runtime image doesn't know the repo, only:
#
#   dist/                  ← client build (kumiko-build): admin.html + index.html
#   dist-server/           ← server bundle (server.js + kumiko.js) + minimal package.json
#   kumiko/migrations/     ← checked-in SQL migrations (schema apply)
#   seeds/                 ← demo content seeds (run once at boot)
#
# Build context: repository root (standalone repo).

ARG BUN_VERSION=1.3.14
ARG NPM_AUTH_TOKEN=
ARG BUILD_VERSION=dev
ARG BUILD_TIME=unknown

# ----- build: produces dist/ + dist-server/ ---------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS build
WORKDIR /app

# All show-pony deps are public NPM (@cosmicdrift/kumiko-*). The token is wired
# anyway so the proven _docker-build-push build-arg lands somewhere; harmless.
ARG NPM_AUTH_TOKEN
ENV GITHUB_TOKEN=${NPM_AUTH_TOKEN}

COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

# ----- runtime: bun-alpine, knows only the bundle artifact ------------------
FROM oven/bun:${BUN_VERSION}-alpine AS runtime
# Global ARGs are only visible in a stage after re-declaration — without these
# lines ENV BUILD_VERSION stayed empty and /api/version always showed "dev".
ARG BUILD_VERSION=dev
ARG BUILD_TIME=unknown
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/dist-server ./
RUN bun install --production

COPY --from=build --chown=app:app /app/dist ./dist

COPY --from=build --chown=app:app /app/kumiko ./kumiko

COPY --from=build --chown=app:app /app/seeds ./seeds

USER app

ENV NODE_ENV=production
ENV PORT=3000
ENV KUMIKO_REPO_ROOT=/app
ENV INIT_CWD=/app
ENV BUILD_VERSION=$BUILD_VERSION
ENV BUILD_TIME=$BUILD_TIME

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --spider "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["sh", "-c", "exec bun run server.js"]
