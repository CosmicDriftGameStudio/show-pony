// Animated loops for tutorial chapters. Reuses screenshot setup (login + seed).
// Output: <LOOP_DIR>/<name>.gif — copy to kumiko-platform/apps/docs/public/loops/show-pony/

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { APEX_URL, DEMO_SLUG, publicEventUrl, STORAGE_STATE } from "../screenshots/constants";
import { HOST_VIEWPORT, PUBLIC_VIEWPORT, recordGif, recordMultiPartGif } from "./recorder";

const LOOP_DIR =
  process.env.LOOP_DIR ?? resolve(import.meta.dirname, "../../docs/loops/show-pony");

test.describe.configure({ mode: "serial" });

test("02-theme-toggle", async ({ browser }) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  await recordGif(
    browser,
    resolve(LOOP_DIR, ".frames-02-theme"),
    resolve(LOOP_DIR, "02-theme-toggle.gif"),
    HOST_VIEWPORT,
    async (page, { hold }) => {
      await page.goto(`${APEX_URL}/host/event-list`);
      await expect(page.getByText(/^Events$/).first()).toBeVisible({ timeout: 15_000 });
      await hold(10);
      await page.getByRole("button", { name: "Dunkler Modus" }).click();
      await hold(12);
      await page.getByRole("button", { name: "Heller Modus" }).click();
      await hold(10);
    },
    STORAGE_STATE,
  );
});

test("03-login", async ({ browser }) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  await recordGif(
    browser,
    resolve(LOOP_DIR, ".frames-03-login"),
    resolve(LOOP_DIR, "03-login.gif"),
    HOST_VIEWPORT,
    async (page, { hold, type }) => {
      await page.goto(`${APEX_URL}/login`);
      await expect(page.locator("#login-email")).toBeVisible();
      await hold(12);
      await type(page.locator("#login-email"), "admin@show-pony.local", 2);
      await hold(4);
      await type(page.locator("#login-password"), "changeme", 3);
      await hold(4);
      await page.click('button[type="submit"]');
      await expect(page.getByText(/^Events$/).first()).toBeVisible({ timeout: 15_000 });
      await hold(16);
    },
  );
});

test("06-host-nav", async ({ browser }) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  await recordGif(
    browser,
    resolve(LOOP_DIR, ".frames-06-nav"),
    resolve(LOOP_DIR, "06-host-nav.gif"),
    HOST_VIEWPORT,
    async (page, { hold }) => {
      await page.goto(`${APEX_URL}/host/event-list`);
      await expect(page.getByText("Rooftop Launch Party").first()).toBeVisible({ timeout: 15_000 });
      await hold(10);
      await page.getByRole("link", { name: /^Guest list$|^Gästeliste$/ }).click();
      await expect(page.getByText("Ava Chen").first()).toBeVisible({ timeout: 15_000 });
      await hold(14);
      await page.getByRole("link", { name: /^Events$|^Neues Event$/ }).first().click();
      await expect(page.getByText("Winter Warmup Drinks").first()).toBeVisible({ timeout: 15_000 });
      await hold(12);
    },
    STORAGE_STATE,
  );
});

test("07-rsvp-roundtrip", async ({ browser }) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  await recordMultiPartGif(
    browser,
    resolve(LOOP_DIR, ".frames-07"),
    resolve(LOOP_DIR, "07-rsvp-roundtrip.gif"),
    [
      {
        viewport: PUBLIC_VIEWPORT,
        run: async (page, { hold, type }) => {
          await page.goto(publicEventUrl(DEMO_SLUG));
          await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible();
          await hold(12);
          await type(page.getByRole("textbox", { name: "Name" }), "Alex", 4);
          await hold(6);
          await page.getByRole("button", { name: "Send RSVP" }).click();
          await expect(page.getByText(/Thanks, Alex/)).toBeVisible({ timeout: 10_000 });
          await hold(14);
        },
      },
      {
        viewport: HOST_VIEWPORT,
        storageState: STORAGE_STATE,
        run: async (page, { hold }) => {
          await page.goto(`${APEX_URL}/host/rsvp-list`);
          await expect(page.getByRole("cell", { name: "Alex" })).toBeVisible({ timeout: 15_000 });
          await hold(18);
        },
      },
    ],
  );
});

test("09-public-form", async ({ browser }) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  await recordGif(
    browser,
    resolve(LOOP_DIR, ".frames-09"),
    resolve(LOOP_DIR, "09-public-form.gif"),
    PUBLIC_VIEWPORT,
    async (page, { hold, type }) => {
      await page.goto(publicEventUrl(DEMO_SLUG));
      await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible();
      await hold(12);
      await type(page.getByRole("textbox", { name: "Name" }), "Sam", 5);
      await hold(6);
      await page.getByRole("button", { name: "Maybe" }).click();
      await hold(8);
      await page.getByRole("button", { name: "Send RSVP" }).click();
      await expect(page.getByText(/Thanks, Sam/)).toBeVisible({ timeout: 10_000 });
      await hold(14);
    },
  );
});

test("12-marketing-journey", async ({ browser }) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  await recordGif(
    browser,
    resolve(LOOP_DIR, ".frames-12-marketing"),
    resolve(LOOP_DIR, "12-marketing-journey.gif"),
    HOST_VIEWPORT,
    async (page, { hold }) => {
      await page.goto(`${APEX_URL}/`);
      await expect(page.getByRole("heading", { name: /Your event/i })).toBeVisible({ timeout: 15_000 });
      await hold(14);
      await page.getByRole("link", { name: /^Features$/i }).first().click();
      await expect(page.getByRole("heading", { name: /How Show Pony works/i })).toBeVisible({
        timeout: 15_000,
      });
      await hold(12);
      await page.getByRole("link", { name: /^Pricing$/i }).first().click();
      await expect(page.getByRole("heading", { name: /Plans for growing hosts/i }).first()).toBeVisible({
        timeout: 15_000,
      });
      await hold(12);
      await page.getByRole("link", { name: /^Login$/i }).first().click();
      await expect(page.locator("#login-email")).toBeVisible({ timeout: 15_000 });
      await hold(16);
    },
  );
});

test("13-legal-page", async ({ browser }) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  await recordGif(
    browser,
    resolve(LOOP_DIR, ".frames-13-legal"),
    resolve(LOOP_DIR, "13-legal-page.gif"),
    HOST_VIEWPORT,
    async (page, { hold }) => {
      await page.goto(`${APEX_URL}/`);
      await expect(page.getByRole("heading", { name: /Your event/i })).toBeVisible({ timeout: 15_000 });
      await hold(8);
      await page.goto(`${APEX_URL}/legal/imprint`);
      await expect(page).toHaveTitle(/Imprint · Show Pony/i, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: /Provider|Imprint/i }).first()).toBeVisible({
        timeout: 15_000,
      });
      await hold(18);
    },
  );
});




