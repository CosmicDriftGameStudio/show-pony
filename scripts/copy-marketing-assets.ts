import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/screenshots", { recursive: true });
await cp("public/logos", "dist/logos", { recursive: true });
// biome-ignore lint/suspicious/noConsole: build-script stdout
console.log("[copy-marketing-assets] public/logos → dist/logos");

await cp("public/screenshots", "dist/screenshots", { recursive: true });
// biome-ignore lint/suspicious/noConsole: build-script stdout
console.log("[copy-marketing-assets] public/screenshots → dist/screenshots");
