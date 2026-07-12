import { cp, mkdir } from "node:fs/promises";

const SCREENSHOT_MAP: Readonly<Record<string, string>> = {
  "events-dashboard": "docs/screenshots/host-events/en/default-light/desktop.png",
  "public-rsvp": "docs/screenshots/public-event/en/default-light/desktop.png",
  "platform-overview": "docs/screenshots/platform-overview/en/default-light/desktop.png",
};

await mkdir("public/screenshots", { recursive: true });
await mkdir("dist/screenshots", { recursive: true });

await cp("public/logos", "dist/logos", { recursive: true });
// biome-ignore lint/suspicious/noConsole: build-script stdout
console.log("[copy-marketing-assets] public/logos → dist/logos");

for (const [name, src] of Object.entries(SCREENSHOT_MAP)) {
  await cp(src, `dist/screenshots/${name}.png`);
  await cp(src, `public/screenshots/${name}.png`);
  // biome-ignore lint/suspicious/noConsole: build-script stdout
  console.log(`[copy-marketing-assets] ${src} → dist/screenshots/${name}.png`);
}
