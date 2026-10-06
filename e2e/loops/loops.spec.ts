// Animated loops for tutorial chapters. Each test seeds its own tenant
// (kumiko-testing seedTenant) and records its own GIF — no shared
// login/seed state with the screenshot runner.
// Output: <LOOP_DIR>/<name>.gif — copy to kumiko-platform/apps/docs/public/loops/show-pony/

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@cosmicdrift/kumiko-testing/e2e";
import { DEMO_HOST_PRESENTED_EMAIL, seedDemoHostTenant } from "../seeds/demo-host";
import { seedLoopEvent, seedLoopGuest } from "../seeds/loops";
import { APEX_URL, publicEventUrl, publicOrigin } from "./env";
import { waitForWrite } from "./wait-for-write";
import { HOST_VIEWPORT, PUBLIC_VIEWPORT, recordGif, recordMultiPartGif } from "./recorder";

const LOOP_DIR =
  process.env["LOOP_DIR"] ?? resolve(import.meta.dirname, "../../docs/loops/show-pony");

test("02-theme-toggle", async ({ browser, seedTenant }, testInfo) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  const { tenant, host, identities } = await seedDemoHostTenant(seedTenant);
  await recordGif(
    browser,
    testInfo.outputPath("frames"),
    resolve(LOOP_DIR, "02-theme-toggle.gif"),
    HOST_VIEWPORT,
    async (page, { hold }) => {
      await tenant.loginAs(page, host);
      await page.goto(`${APEX_URL}/host/event-list`);
      await expect(page.getByText(/^Events$/).first()).toBeVisible();
      await hold(10);
      const themeToggle = page.getByTestId("theme-toggle");
      const root = page.locator("html");
      await themeToggle.click();
      await expect(root).toHaveClass(/\bdark\b/);
      await hold(12);
      // light -> dark -> auto: the second step lands on auto, which follows
      // the browser's light color scheme.
      await themeToggle.click();
      await expect(root).not.toHaveClass(/\bdark\b/);
      await hold(10);
    },
    APEX_URL,
    identities,
  );
});

test("03-login", async ({ browser, seedTenant }, testInfo) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  const { host, identities } = await seedDemoHostTenant(seedTenant);
  await recordGif(
    browser,
    testInfo.outputPath("frames"),
    resolve(LOOP_DIR, "03-login.gif"),
    HOST_VIEWPORT,
    async (page, { hold, type }) => {
      await page.goto(`${APEX_URL}/login`);
      await expect(page.locator("#login-email")).toBeVisible();
      await hold(12);
      // The seeded email carries the tenant id (global uniqueness), so the
      // loop types the presented address and swaps in the real one before
      // the next frame; captureFrame presents it again in the field.
      await type(page.locator("#login-email"), DEMO_HOST_PRESENTED_EMAIL, 2);
      await page.locator("#login-email").fill(host.email);
      await hold(4);
      // The generated password (pw-<uuid>) is long: 1 frame/char keeps this
      // well inside the fixed 30s test budget.
      await type(page.locator("#login-password"), host.password, 1);
      await hold(4);
      await page.click('button[type="submit"]');
      await expect(page.getByText(/^Events$/).first()).toBeVisible();
      await hold(16);
    },
    APEX_URL,
    identities,
  );
});

test("06-host-nav", async ({ browser, seedTenant }, testInfo) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  const { tenant, host, identities } = await seedDemoHostTenant(seedTenant);
  const { id: eventId } = await seedLoopEvent(tenant.apiAs(host));
  await seedLoopGuest(publicOrigin(tenant.key), {
    eventId,
    name: "Ava Chen",
    status: "yes",
    plusN: 2,
  });
  await recordGif(
    browser,
    testInfo.outputPath("frames"),
    resolve(LOOP_DIR, "06-host-nav.gif"),
    HOST_VIEWPORT,
    async (page, { hold }) => {
      await tenant.loginAs(page, host);
      await page.goto(`${APEX_URL}/host/event-list`);
      await expect(page.getByText("Rooftop Launch Party").first()).toBeVisible();
      await hold(10);
      await page.getByRole("link", { name: /^Guest list$|^Gästeliste$/ }).click();
      await expect(page.getByText("Ava Chen").first()).toBeVisible();
      await hold(14);
      await page.getByRole("link", { name: /^Events$|^Neues Event$/ }).first().click();
      await expect(page.getByText("Rooftop Launch Party").first()).toBeVisible();
      await hold(12);
    },
    APEX_URL,
    identities,
  );
});

test("06-create-event", async ({ browser, seedTenant }, testInfo) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  // Free tier caps maxEvents at 1 — no pre-seeded event, so the one created
  // live during the recording stays under the cap.
  const { tenant, host, identities } = await seedDemoHostTenant(seedTenant);
  await recordGif(
    browser,
    testInfo.outputPath("frames"),
    resolve(LOOP_DIR, "06-create-event.gif"),
    HOST_VIEWPORT,
    async (page, { hold, type }) => {
      await tenant.loginAs(page, host);
      await page.goto(`${APEX_URL}/host/event-edit`);
      await expect(page.getByRole("heading", { name: /Edit event|Event bearbeiten/i })).toBeVisible();
      await hold(10);
      await type(page.getByRole("textbox", { name: /Title/i }), "Summer Rooftop Meetup", 2);
      await type(page.getByRole("textbox", { name: /Slug/i }), "summer-rooftop-meetup", 2);
      await page.getByRole("textbox", { name: /Starts at/i }).fill("10/24/2026");
      await page.getByRole("textbox", { name: "Time" }).fill("19:00");
      await type(page.getByRole("textbox", { name: /Location/i }), "Sky Lounge", 2);
      await hold(6);
      await page.getByRole("textbox", { name: /Description/i }).fill("An evening under the stars.");
      // Sync on the real event:create response instead of a padded per-call
      // timeout — the default 5s expect timeout then only covers the
      // client-side redirect/render after a response we already know succeeded.
      const [createRes] = await Promise.all([
        waitForWrite(page, "showpony:write:event:create"),
        page.getByRole("button", { name: /Create|Save|Speichern/i }).click(),
      ]);
      expect(createRes.ok()).toBe(true);
      await expect(page).toHaveURL(/\/host\/event-list/);
      await expect(page.getByText("Summer Rooftop Meetup").first()).toBeVisible();
      await hold(16);
    },
    APEX_URL,
    identities,
  );
});

test("07-rsvp-roundtrip", async ({ browser, seedTenant }, testInfo) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  const { tenant, host, identities } = await seedDemoHostTenant(seedTenant);
  const { slug } = await seedLoopEvent(tenant.apiAs(host));
  await recordMultiPartGif(
    browser,
    testInfo.outputPath("frames"),
    resolve(LOOP_DIR, "07-rsvp-roundtrip.gif"),
    APEX_URL,
    [
      {
        viewport: PUBLIC_VIEWPORT,
        run: async (page, { hold, type }) => {
          await page.goto(publicEventUrl(tenant.key, slug));
          await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible();
          await hold(12);
          await type(page.getByRole("textbox", { name: "Name" }), "Alex", 4);
          await hold(6);
          // Sync on the real rsvp:submit response instead of a padded timeout.
          const [rsvpRes] = await Promise.all([
            waitForWrite(page, "showpony:write:rsvp:submit"),
            page.getByRole("button", { name: "Send RSVP" }).click(),
          ]);
          expect(rsvpRes.ok()).toBe(true);
          await expect(page.getByText(/Thanks, Alex/)).toBeVisible();
          await hold(14);
        },
      },
      {
        viewport: HOST_VIEWPORT,
        run: async (page, { hold }) => {
          await tenant.loginAs(page, host);
          await page.goto(`${APEX_URL}/host/rsvp-list`);
          await expect(page.getByRole("cell", { name: "Alex" })).toBeVisible();
          await hold(18);
        },
      },
    ],
    identities,
  );
});

test("09-public-form", async ({ browser, seedTenant }, testInfo) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  const { tenant, host, identities } = await seedDemoHostTenant(seedTenant);
  const { slug } = await seedLoopEvent(tenant.apiAs(host));
  await recordGif(
    browser,
    testInfo.outputPath("frames"),
    resolve(LOOP_DIR, "09-public-form.gif"),
    PUBLIC_VIEWPORT,
    async (page, { hold, type }) => {
      await page.goto(publicEventUrl(tenant.key, slug));
      await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible();
      await hold(12);
      await type(page.getByRole("textbox", { name: "Name" }), "Sam", 5);
      await hold(6);
      await page.getByRole("button", { name: "Maybe" }).click();
      await hold(8);
      // Sync on the real rsvp:submit response instead of a padded timeout.
      const [rsvpRes] = await Promise.all([
        waitForWrite(page, "showpony:write:rsvp:submit"),
        page.getByRole("button", { name: "Send RSVP" }).click(),
      ]);
      expect(rsvpRes.ok()).toBe(true);
      await expect(page.getByText(/Thanks, Sam/)).toBeVisible();
      await hold(14);
    },
    APEX_URL,
    identities,
  );
});

test("12-marketing-journey", async ({ browser }, testInfo) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  await recordGif(
    browser,
    testInfo.outputPath("frames"),
    resolve(LOOP_DIR, "12-marketing-journey.gif"),
    HOST_VIEWPORT,
    async (page, { hold }) => {
      await page.goto(`${APEX_URL}/`);
      await expect(page.getByRole("heading", { name: /Your event/i })).toBeVisible();
      await hold(14);
      await page.getByRole("link", { name: /^Features$/i }).first().click();
      await expect(page.getByRole("heading", { name: /How Show Pony works/i })).toBeVisible();
      await hold(12);
      await page.getByRole("link", { name: /^Pricing$/i }).first().click();
      await expect(page.getByRole("heading", { name: /Plans for growing hosts/i }).first()).toBeVisible();
      await hold(12);
      await page.getByRole("link", { name: /^Login$/i }).first().click();
      await expect(page.locator("#login-email")).toBeVisible();
      await hold(16);
    },
    APEX_URL,
  );
});

test("13-legal-page", async ({ browser }, testInfo) => {
  mkdirSync(LOOP_DIR, { recursive: true });
  await recordGif(
    browser,
    testInfo.outputPath("frames"),
    resolve(LOOP_DIR, "13-legal-page.gif"),
    HOST_VIEWPORT,
    async (page, { hold }) => {
      await page.goto(`${APEX_URL}/`);
      await expect(page.getByRole("heading", { name: /Your event/i })).toBeVisible();
      await hold(8);
      await page.goto(`${APEX_URL}/legal/imprint`);
      await expect(page).toHaveTitle(/Imprint · Show Pony/i);
      await expect(page.getByRole("heading", { name: /Provider|Imprint/i }).first()).toBeVisible();
      await hold(18);
    },
    APEX_URL,
  );
});
