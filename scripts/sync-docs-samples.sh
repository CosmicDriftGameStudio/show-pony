#!/usr/bin/env bash
# Mirror show-pony sources into kumiko-platform tutorial embeds (_samples/show-pony).
# Run from show-pony root after code changes that affect docs.kumiko.rocks embeds.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${DOCS_SAMPLES:-$ROOT/../kumiko-platform/apps/docs/_samples/show-pony}"

if [ ! -d "$DEST" ]; then
  echo "sync-docs-samples: destination not found: $DEST" >&2
  echo "Set DOCS_SAMPLES to kumiko-platform/apps/docs/_samples/show-pony" >&2
  exit 1
fi

rsync -a "$ROOT/bin/" "$DEST/bin/"
rsync -a --delete --exclude generated "$ROOT/src/" "$DEST/src/"
rsync -a "$ROOT/deploy/" "$DEST/deploy/"
rsync -a "$ROOT/docker-compose.yml" "$DEST/"
rsync -a "$ROOT/public/index.html" "$DEST/public/"
rsync -a "$ROOT/e2e/screenshots/scenarios.ts" "$DEST/e2e/screenshots/"
mkdir -p "$DEST/seeds"
rsync -a "$ROOT/seeds/2026-06-28-demo-event-rsvps.ts" "$ROOT/seeds/2026-07-14-invite-hero-webp.ts" "$ROOT/seeds/_demo-event-db.ts" "$DEST/seeds/"
rsync -a "$ROOT/public/heroes/" "$DEST/public/heroes/"
echo "sync-docs-samples: $ROOT -> $DEST"
