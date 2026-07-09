// Animated loops for tutorial chapters. Reuses screenshot setup (login + seed).
// Output: <LOOP_DIR>/<name>.gif — copy to kumiko-platform/apps/docs/public/loops/show-pony/

import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { APEX_URL, DEMO_SLUG, publicEventUrl, STORAGE_STATE } from "../screenshots/constants";

const LOOP_DIR =
  process.env.LOOP_DIR ?? resolve(import.meta.dirname, "../../docs/loops/show-pony");

function webmToGif(webmPath: string, gifPath: string): void {
  execSync(
    `ffmpeg -y -i "${webmPath}" -vf "fps=12,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${gifPath}"`,
    { stdio: "pipe" },
  );
}

function latestWebm(dir: string): string {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => ({ f, m: statSync(resolve(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  if (files.length === 0) throw new Error(`no webm in ${dir}`);
  return resolve(dir, files[0].f);
}

test.describe.configure({ mode: "serial" });

test("02-login", async ({ browser }) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  const videoDir = resolve(LOOP_DIR, ".video-02");
  mkdirSync(videoDir, { recursive: true });

  const ctx = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 640, height: 480 } },
    viewport: { width: 640, height: 480 },
  });
  const page = await ctx.newPage();
  await page.goto(`${APEX_URL}/login`);
  await page.fill("#login-email", "admin@show-pony.local");
  await page.fill("#login-password", "changeme");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("login"), { timeout: 15_000 });
  await page.waitForTimeout(800);
  await ctx.close();

  webmToGif(latestWebm(videoDir), resolve(LOOP_DIR, "02-login.gif"));
});

test("06-rsvp-roundtrip", async ({ browser }) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  const videoDir = resolve(LOOP_DIR, ".video-06");
  mkdirSync(videoDir, { recursive: true });

  const guestCtx = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 640, height: 480 } },
    viewport: { width: 640, height: 480 },
  });
  const guestPage = await guestCtx.newPage();
  await guestPage.goto(publicEventUrl(DEMO_SLUG));
  await expect(guestPage.locator("form")).toBeVisible();
  await guestPage.getByRole("textbox", { name: "Name" }).fill("Alex");
  await guestPage.getByRole("button", { name: "Send RSVP" }).click();
  await guestPage.waitForTimeout(1000);
  await guestCtx.close();

  const hostCtx = await browser.newContext({
    storageState: STORAGE_STATE,
    recordVideo: { dir: videoDir, size: { width: 640, height: 480 } },
    viewport: { width: 640, height: 480 },
  });
  const hostPage = await hostCtx.newPage();
  await hostPage.goto(`${APEX_URL}/host/rsvp-list`);
  await expect(hostPage.locator("table tbody tr").first()).toBeVisible({ timeout: 15_000 });
  await hostPage.waitForTimeout(600);
  await hostCtx.close();

  webmToGif(latestWebm(videoDir), resolve(LOOP_DIR, "06-rsvp-roundtrip.gif"));
});

test("08-public-form", async ({ browser }) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  const videoDir = resolve(LOOP_DIR, ".video-08");
  mkdirSync(videoDir, { recursive: true });

  const ctx = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 640, height: 480 } },
    viewport: { width: 640, height: 480 },
  });
  const page = await ctx.newPage();
  await page.goto(publicEventUrl(DEMO_SLUG));
  await expect(page.locator("form")).toBeVisible();
  await page.getByRole("textbox", { name: "Name" }).fill("Sam");
  await page.waitForTimeout(1200);
  await ctx.close();

  webmToGif(latestWebm(videoDir), resolve(LOOP_DIR, "08-public-form.gif"));
});
