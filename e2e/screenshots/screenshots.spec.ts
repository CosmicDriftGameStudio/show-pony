// Captures each scenario × theme × viewport in one run →
// <dir>/<name>/<locale>/<theme>/<viewport>.png (override dir via SCREENSHOT_DIR).
// That layout feeds the ScreenshotPreview switcher in the docs 1:1. Docs are
// English, so locale stays "en" by default; the switcher toggles theme +
// viewport only.
//
// Standalone repo (pinned published kumiko) → copies the matrix loop from the
// convention (kumiko-platform/docs/reference/screenshot-runner.md) instead of
// importing the samples-only helper. Theme = .dark class on <html> (renderer-web
// reads it live, no reload); locale = kumiko:locale set before goto.

import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { SCENARIOS } from "./scenarios";

const BASE_DIR =
  process.env.SCREENSHOT_DIR ?? resolve(import.meta.dirname, "../../docs/screenshots");

const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
} as const;
type ViewportId = keyof typeof VIEWPORTS;

const THEMES = ["default-light", "default-dark"] as const;
type ThemeId = (typeof THEMES)[number];

async function applyTheme(page: Page, theme: ThemeId): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.classList.toggle("dark", t === "default-dark");
  }, theme);
}

// Env override narrows an axis (CSV) or falls back to the default. The cast only
// carries the system boundary env-string → known union.
function axis<T extends string>(env: string | undefined, all: readonly T[]): readonly T[] {
  const picked = env
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return picked && picked.length > 0 ? (picked as T[]) : all;
}

const LOCALES = axis(process.env.SCREENSHOT_LOCALES, ["en"]);
const THEME_AXIS = axis(process.env.SCREENSHOT_THEMES, THEMES);
const VIEWPORT_AXIS = axis(process.env.SCREENSHOT_VIEWPORTS, Object.keys(VIEWPORTS) as ViewportId[]);

test.describe.configure({ mode: "serial" });

for (const locale of LOCALES) {
  for (const s of SCENARIOS) {
    test(`${locale} — ${s.name}`, async ({ page }) => {
      // kumiko:locale drives the boot language (before goto); drop kumiko:theme
      // so the mode is decided solely by applyTheme.
      await page.addInitScript((lng) => {
        localStorage.setItem("kumiko:locale", lng);
        localStorage.removeItem("kumiko:theme");
      }, locale);
      if (s.clearAuth) await page.context().clearCookies();
      await page.goto(s.url);
      await expect(page.locator(s.waitFor).first()).toBeVisible({ timeout: 15_000 });
      if (s.settleMs) await page.waitForTimeout(s.settleMs);

      for (const theme of THEME_AXIS) {
        await applyTheme(page, theme);
        for (const vp of VIEWPORT_AXIS) {
          await page.setViewportSize(VIEWPORTS[vp]);
          await page.waitForTimeout(150); // reflow after viewport change
          const dir = `${BASE_DIR}/${s.name}/${locale}/${theme}`;
          mkdirSync(dir, { recursive: true });
          const path = `${dir}/${vp}.png`;
          await page.screenshot({ path });
          expect.soft(statSync(path).size).toBeGreaterThan(5 * 1024);
        }
      }
    });
  }
}


