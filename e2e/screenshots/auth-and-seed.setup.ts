// Setup-Step für den Screenshot-Runner: als Host einloggen, ein Demo-Event
// anlegen (authed) + ein paar Gäste anonym über die Subdomain zusagen
// lassen — damit Dashboard, Gästeliste und public Page nicht leer sind.
// Speichert am Ende den Login-State für das shots-Projekt.
//
// Event-sourced: nach jedem Write auf die Projektion pollen (Lag). Die
// authed Requests setzen X-Tenant explizit — ein raw fetch hat keinen
// SPA-Tenant-Switcher, der das sonst mitschickt.

import { mkdir } from "node:fs/promises";
import { expect, test as setup } from "@playwright/test";
import { APEX_URL, DEMO_SLUG, DEMO_TENANT_ID, publicEventUrl, STORAGE_STATE } from "./constants";

const HOST = { email: "admin@show-pony.local", password: "changeme" };

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
    async ({ type, payload, tenantId }) => {
      const csrf = document.cookie
        .split("; ")
        .find((r) => r.startsWith("kumiko_csrf="))
        ?.split("=")[1];
      const res = await fetch("/api/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant": tenantId,
          ...(csrf ? { "X-CSRF-Token": decodeURIComponent(csrf) } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ type, payload }),
      });
      return { status: res.status, body: await res.text() };
    },
    { type, payload, tenantId: DEMO_TENANT_ID },
  );
}

async function authedCount(
  page: import("@playwright/test").Page,
  type: string,
): Promise<number> {
  return page.evaluate(
    async ({ type, tenantId }) => {
      const csrf = document.cookie
        .split("; ")
        .find((r) => r.startsWith("kumiko_csrf="))
        ?.split("=")[1];
      const res = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant": tenantId,
          ...(csrf ? { "X-CSRF-Token": decodeURIComponent(csrf) } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ type, payload: {} }),
      });
      const body = (await res.json()) as { data?: { rows?: unknown[] } };
      return body.data?.rows?.length ?? 0;
    },
    { type, tenantId: DEMO_TENANT_ID },
  );
}

setup("login + seed demo event", async ({ page, browser }) => {
  // 1. UI-Login als Host (setzt die Auth-Cookie auf dem Apex).
  await page.goto(`${APEX_URL}/login`);
  await page.fill("#login-email", HOST.email);
  await page.fill("#login-password", HOST.password);
  await page.locator("#login-password").press("Enter");
  await expect(page.getByText(/^Events$/).first()).toBeVisible({ timeout: 15_000 });

  // 2. Event anlegen.
  const created = await authedWrite(page, "showpony:write:event:create", {
    title: "Rooftop Launch Party",
    slug: DEMO_SLUG,
    startsAt: "2026-09-12T19:00:00.000Z",
    location: "Sky Lounge, 24th floor",
    description: "Drinks, a live set, and 2.0 going out at midnight. Bring someone good.",
    guestLimit: 80,
  });
  const parsed = JSON.parse(created.body) as { isSuccess: boolean; data?: { id: string } };
  const eventId = parsed.isSuccess ? (parsed.data?.id ?? null) : null;
  expect(eventId, created.body).toBeTruthy();

  // 3. Auf die Event-Projektion warten.
  await expect
    .poll(() => authedCount(page, "showpony:query:event:list"), { timeout: 15_000 })
    .toBeGreaterThan(0);

  // 4. RSVPs anonym über die Subdomain — frischer Context ohne Host-Cookie,
  //    damit der Tenant aus dem Host-Header kommt (nicht aus einer Session).
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

  // 5. Auf die RSVP-Projektion warten (authed gelesen).
  await expect.poll(() => authedCount(page, "showpony:query:rsvp:list"), { timeout: 15_000 }).toBeGreaterThanOrEqual(GUESTS.length);

  // 6. Login-State sichern (der Apex-Cookie steckt im page-Context).
  await mkdir("e2e/screenshots/.auth", { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
