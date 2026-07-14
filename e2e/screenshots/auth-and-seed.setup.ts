// Setup step for the screenshot runner: log in as host, create demo + acme
// events (one per tenant under free-tier caps) + seed guest RSVPs on demo.
// Saves the login state at the end for the shots project.
//
// Entity writes use the session tenant (cap-guard counts against it), so we
// switch via the top-bar TenantSwitcher — X-Tenant alone is not enough.

import { mkdir } from "node:fs/promises";
import { expect, test as setup } from "@playwright/test";
import {
  ACME_SLUG,
  APEX_URL,
  DEMO_SLUG,
  acmePublicEventUrl,
  publicEventUrl,
  STORAGE_STATE,
} from "./constants";

const HOST = { email: "admin@show-pony.local", password: "changeme" };

const BRANDING_TITLE = "managed-pages:config:branding-title";
const BRANDING_DESCRIPTION = "managed-pages:config:branding-description";
const BRANDING_ACCENT = "managed-pages:config:branding-accent-color";
const INVITE_HERO_URL = "showpony:config:invite-hero-image-url";
const INVITE_HERO_STYLE = "showpony:config:invite-hero-style";

const GUESTS = [
  { name: "Ava Chen", status: "yes", plusN: 2 },
  { name: "Marcus Bell", status: "yes", plusN: 0 },
  { name: "Priya Raman", status: "maybe", plusN: 1 },
  { name: "Diego Santos", status: "no", plusN: 0 },
] as const;

async function authedWrite(
  page: import("@playwright/test").Page,
  type: string,
  payload: Record<string, unknown>,
): Promise<{ status: number; body: string }> {
  return page.evaluate(
    async ({ type, payload }) => {
      const csrf = document.cookie
        .split("; ")
        .find((r) => r.startsWith("kumiko_csrf="))
        ?.split("=")[1];
      const res = await fetch("/api/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRF-Token": decodeURIComponent(csrf) } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ type, payload }),
      });
      return { status: res.status, body: await res.text() };
    },
    { type, payload },
  );
}

async function seedBranding(
  page: import("@playwright/test").Page,
  entries: ReadonlyArray<readonly [string, string]>,
): Promise<void> {
  for (const [key, value] of entries) {
    const res = await authedWrite(page, "config:write:set", { key, value });
    expect(JSON.parse(res.body).isSuccess, res.body).toBe(true);
  }
}

async function switchTenant(page: import("@playwright/test").Page, targetLabel: string): Promise<void> {
  const active = page.getByRole("button").filter({ hasText: /Demo Host|Acme Studios/ });
  if ((await active.textContent())?.match(new RegExp(targetLabel, "i"))) return;
  await active.click();
  await page.getByRole("menuitemcheckbox", { name: new RegExp(targetLabel, "i") }).click();
  await expect(page.getByText(/^Events$/).first()).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("button").filter({ hasText: new RegExp(targetLabel, "i") }),
  ).toBeVisible();
}

setup("login + seed demo event", async ({ page, browser }) => {
  await page.goto(`${APEX_URL}/login`);
  await page.fill("#login-email", HOST.email);
  await page.fill("#login-password", HOST.password);
  await page.locator("#login-password").press("Enter");
  await expect(page.getByText(/^Events$/).first()).toBeVisible({ timeout: 15_000 });

  const rooftopDesc = `✨ You're on the list for something special.

Join us on the 24th floor — cocktails, live DJ, and the Show Pony 2.0 launch at midnight 🎉

Dress code: rooftop-ready 👠
Bring someone you'd proudly introduce to the team 💜`;

  const acmeDesc = `🎨 Team offsite season is here!

Workshops in the morning, pizza on the studio floor, and zero mandatory fun runs 😅

RSVP so we know how many chairs (and how much coffee) to order ☕️`;

  await switchTenant(page, "Acme Studios");
  await seedBranding(page, [
    [BRANDING_TITLE, "Acme Studios"],
    [BRANDING_DESCRIPTION, "Clean design. Loud ideas. 🎨"],
    [BRANDING_ACCENT, "#0d9488"],
    [INVITE_HERO_URL, "/heroes/acme-studio.svg"],
    [INVITE_HERO_STYLE, "split"],
  ]);
  const acmeCreated = await authedWrite(page, "showpony:write:event:create", {
    title: "Acme Offsite RSVP",
    slug: ACME_SLUG,
    startsAt: "2026-10-03T18:00:00.000Z",
    location: "Acme HQ — Studio floor",
    description: acmeDesc,
    guestLimit: 60,
  });
  expect(JSON.parse(acmeCreated.body).isSuccess, acmeCreated.body).toBe(true);

  await switchTenant(page, "Demo Host");
  await seedBranding(page, [
    [BRANDING_TITLE, "Mira Events"],
    [BRANDING_DESCRIPTION, "✨ Rooftop invites with sparkle ✨"],
    [BRANDING_ACCENT, "#7c3aed"],
    [INVITE_HERO_URL, "/heroes/demo-rooftop.svg"],
    [INVITE_HERO_STYLE, "immersive"],
  ]);
  const created = await authedWrite(page, "showpony:write:event:create", {
    title: "Rooftop Launch Party",
    slug: DEMO_SLUG,
    startsAt: "2026-09-12T19:00:00.000Z",
    location: "Sky Lounge, 24th floor",
    description: rooftopDesc,
    guestLimit: 80,
  });
  const parsed = JSON.parse(created.body) as { isSuccess: boolean; data?: { id: string } };
  const eventId = parsed.isSuccess ? (parsed.data?.id ?? null) : null;
  expect(eventId, created.body).toBeTruthy();

  const verify = await browser.newContext();
  const verifyPage = await verify.newPage();
  await verifyPage.goto(acmePublicEventUrl(ACME_SLUG));
  await expect(verifyPage.getByRole("heading", { name: /Acme Offsite/i })).toBeVisible({ timeout: 15_000 });
  await verify.close();

  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(publicEventUrl(DEMO_SLUG));
  for (const guest of GUESTS) {
    await anonPage.evaluate(
      async ({ eventId, guest }) => {
        await fetch("/api/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "showpony:write:rsvp:submit", payload: { eventId, ...guest } }),
        });
      },
      { eventId, guest },
    );
  }
  await anon.close();

  await page.goto(`${APEX_URL}/host/rsvp-list`);
  await expect.poll(async () => page.getByText("Ava Chen").count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);

  await mkdir("e2e/screenshots/.auth", { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});





