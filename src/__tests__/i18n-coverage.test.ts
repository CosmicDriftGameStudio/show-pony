import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRegistry } from "@cosmicdrift/kumiko-framework/engine";
import { appShellTranslationsByLocale } from "../features/app-shell/client";
import { appShellFeature } from "../features/app-shell/feature";
import { showPonyFeature } from "../features/show-pony/feature";
import { showPonyTranslations } from "../features/show-pony/i18n";

// Keys are also used outside the feature dir (src/public, demo-mode-ui), so the scan covers all of src.
const SOURCE_DIR = join(import.meta.dir, "..");
const KEY_RE = /"(showpony:[^"]+|screen:[^"]+\.title)"/g;
const SKIPPED_PATH_SEGMENTS = ["__tests__", "generated", "i18n"];
// Qualified handler/screen/nav/notification refs share the prefix but are not translation keys.
const QUALIFIED_REF_MARKERS = [":write:", ":screen:", ":nav:", ":query:", ":config:", ":notify:"];

type ShowPonyTranslationKey = keyof typeof showPonyTranslations;

function isShowPonyTranslationKey(key: string): key is ShowPonyTranslationKey {
  return Object.hasOwn(showPonyTranslations, key);
}

function isScannedSourceFile(relativePath: string): boolean {
  if (!relativePath.endsWith(".ts") && !relativePath.endsWith(".tsx")) return false;
  if (relativePath.includes(".test.")) return false;
  const segments = relativePath.split(/[\\/]/);
  return !segments.some((segment) => SKIPPED_PATH_SEGMENTS.includes(segment));
}

function referencedKeys(): ReadonlySet<string> {
  const out = new Set<string>();
  const entries = readdirSync(SOURCE_DIR, { recursive: true, encoding: "utf8" });
  for (const relativePath of entries) {
    if (!isScannedSourceFile(relativePath)) continue;
    const src = readFileSync(join(SOURCE_DIR, relativePath), "utf8");
    for (const match of src.matchAll(KEY_RE)) {
      const key = match[1];
      if (!key || QUALIFIED_REF_MARKERS.some((marker) => key.includes(marker))) continue;
      out.add(key);
    }
  }
  return out;
}

const usedKeys = referencedKeys();

test("source scan finds i18n references in the feature and the public pages", () => {
  expect(usedKeys.size).toBeGreaterThanOrEqual(5);
  expect(usedKeys.has("showpony:public.rsvp.submit")).toBe(true);
});

test("every referenced show-pony key is defined with de + en", () => {
  const missing: string[] = [];
  for (const key of usedKeys) {
    if (!isShowPonyTranslationKey(key)) {
      missing.push(key);
      continue;
    }
    const entry = showPonyTranslations[key];
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
    expect(isShowPonyTranslationKey(nav.label)).toBe(true);
  }
});

test("app-shell workspace labels reach the browser bundle", () => {
  expect(appShellTranslationsByLocale["de"]?.["app-shell:workspace.host"]).toBe("Events");
  expect(appShellTranslationsByLocale["en"]?.["app-shell:workspace.platform"]).toBe("Platform");
});

test("every app-shell workspace label is translated in de + en", () => {
  const workspaces = [...createRegistry([appShellFeature]).getAllWorkspaces().values()];
  expect(workspaces.length).toBeGreaterThan(0);
  for (const workspace of workspaces) {
    expect(appShellTranslationsByLocale["de"]?.[workspace.label]).toBeTruthy();
    expect(appShellTranslationsByLocale["en"]?.[workspace.label]).toBeTruthy();
  }
});
