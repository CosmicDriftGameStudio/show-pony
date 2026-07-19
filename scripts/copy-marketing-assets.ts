// public/screenshots/*.png are hand-cropped marketing stills, not a mirror
// of docs/screenshots/**. They're derived from (and go stale against) the
// Playwright output of `bun run screenshots` — re-run that, then re-crop
// the current source for each file below and drop it back into
// public/screenshots/ under the same name (src/marketing/layouts/marketing.ts
// references these by path):
//   events-dashboard.png   ← docs/screenshots/host-events/en/default-light/desktop.png
//   platform-overview.png  ← docs/screenshots/platform-overview/en/default-light/desktop.png
//   public-rsvp.png        ← docs/screenshots/public-event/en/default-light/desktop.png
import { cp } from "node:fs/promises";

await cp("public/logos", "dist/logos", { recursive: true });
// biome-ignore lint/suspicious/noConsole: build-script stdout
console.log("[copy-marketing-assets] public/logos → dist/logos");

await cp("public/screenshots", "dist/screenshots", { recursive: true });
// biome-ignore lint/suspicious/noConsole: build-script stdout
console.log("[copy-marketing-assets] public/screenshots → dist/screenshots");

await cp("public/heroes", "dist/heroes", { recursive: true });
// biome-ignore lint/suspicious/noConsole: build-script stdout
console.log("[copy-marketing-assets] public/heroes → dist/heroes");


