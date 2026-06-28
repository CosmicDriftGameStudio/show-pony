// Takes one PNG per scenario into docs/screenshots/ (override via
// SCREENSHOT_DIR). Runs in the shots project with the host login from the
// setup step; clearAuth scenarios (public page) start cookie-free.

import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { SCENARIOS } from "./scenarios";

const SCREENSHOT_DIR =
  process.env.SCREENSHOT_DIR ?? resolve(import.meta.dirname, "../../docs/screenshots");

mkdirSync(SCREENSHOT_DIR, { recursive: true });

for (const s of SCENARIOS) {
  test(`${s.name} — ${s.description}`, async ({ page }) => {
    if (s.clearAuth) await page.context().clearCookies();
    await page.goto(s.url);
    await expect(page.locator(s.waitFor).first()).toBeVisible({ timeout: 10_000 });
    if (s.settleMs) await page.waitForTimeout(s.settleMs);

    const path = `${SCREENSHOT_DIR}/${s.name}.png`;
    await page.screenshot({ path });
    expect.soft(statSync(path).size).toBeGreaterThan(5 * 1024);
  });
}
