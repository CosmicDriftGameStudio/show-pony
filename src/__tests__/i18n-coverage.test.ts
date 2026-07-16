import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { appShellTranslationsByLocale } from "../features/app-shell/client";
import { showPonyFeature } from "../features/show-pony/feature";
import { showPonyTranslations } from "../features/show-pony/i18n";

const FEATURE_DIR = join(import.meta.dir, "..", "features", "show-pony");
const KEY_RE = /"(showpony:[^"]+|screen:[^"]+\.title)"/g;

function referencedKeys(): ReadonlySet<string> {
  const out = new Set<string>();
  const entries = readdirSync(FEATURE_DIR, { recursive: true, encoding: "utf8" });
  for (const rel of entries) {
    if (!rel.endsWith(".ts") && !rel.endsWith(".tsx")) continue;
    if (rel.includes("i18n/") || rel.includes("i18n\\")) continue;
    const src = readFileSync(join(FEATURE_DIR, rel), "utf8");
    for (const m of src.matchAll(KEY_RE)) {
      const key = m[1] as string;
      // Qualified handler/screen/nav refs — not translation keys.
      if (
        key.includes(":write:") ||
        key.includes(":screen:") ||
        key.includes(":nav:") ||
        key.includes(":query:") ||
        key.includes(":config:")
      )
        continue;
      out.add(key);
    }
  }
  return out;
}

const definedKeys = new Set(Object.keys(showPonyTranslations));
const usedKeys = referencedKeys();

test("source scan finds i18n references", () => {
  expect(usedKeys.size).toBeGreaterThanOrEqual(5);
});

test("every referenced show-pony key is defined with de + en", () => {
  const missing: string[] = [];
  for (const key of usedKeys) {
    if (!definedKeys.has(key)) {
      missing.push(key);
      continue;
    }
    const entry = showPonyTranslations[key as keyof typeof showPonyTranslations];
    expect(entry.de.length).toBeGreaterThan(0);
    expect(entry.en.length).toBeGreaterThan(0);
  }
  expect(missing).toEqual([]);
});

test("every showpony nav label from feature registry is defined", () => {
  const navs = Object.values(showPonyFeature.navs);
  expect(navs.length).toBeGreaterThan(0);
  for (const nav of navs) {
    if (!nav.label.startsWith("showpony:")) continue;
    expect(definedKeys.has(nav.label)).toBe(true);
  }
});

test("app-shell workspace labels reach the browser bundle", () => {
  expect(appShellTranslationsByLocale.de?.["app-shell:workspace.host"]).toBe("Events");
  expect(appShellTranslationsByLocale.en?.["app-shell:workspace.platform"]).toBe("Platform");
});
