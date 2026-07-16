// Regression pin: src/features/show-pony/invite-branding.ts re-exports the
// engine query handler (server-only). Client-reachable code under src/public
// must import the pure invite-branding.shared module instead, or the query
// handler's server imports (defineQueryHandler, zod, managed-pages) leak
// into the anonymous public bundle.
import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_DIR = join(import.meta.dir, "..", "public");

test("no src/public file imports the engine-tainted invite-branding module", () => {
  const offenders: string[] = [];
  const entries = readdirSync(PUBLIC_DIR, { recursive: true, encoding: "utf8" });
  for (const rel of entries) {
    if (!rel.endsWith(".ts") && !rel.endsWith(".tsx")) continue;
    const src = readFileSync(join(PUBLIC_DIR, rel), "utf8");
    if (/from\s+["'][^"']*\/invite-branding["']/.test(src)) {
      offenders.push(rel);
    }
  }
  expect(offenders).toEqual([]);
});
