// Setup-Step für den Screenshot-Runner: als Host einloggen, ein Demo-Event
// anlegen (authed) + ein paar Gäste anonym über die Subdomain zusagen
// lassen — damit Dashboard, Gästeliste und public Page nicht leer sind.
// Speichert am Ende den Login-State für das shots-Projekt.
//
// Event-sourced: nach jedem Write auf die Projektion pollen (Lag).

import { mkdir } from "node:fs/promises";
import { expect, test as setup } from "@playwright/test";
import { APEX_URL, DEMO_SLUG, publicEventUrl, STORAGE_STATE } from "./constants";

const HOST = { email: "admin@show-pony.local", password: "changeme" };

const GUESTS = [
  { name: "Mara Lindqvist", status: "yes", plusN: 2 },
  { name: "Jonas Weber", status: "yes", plusN: 0 },
  { name: "Lena Hoffmann", status: "maybe", plusN: 1 },
  { name: "Tarek Haddad", status: "no", plusN: 0 },
] as const;

setup("login + seed demo event", async ({ page, browser }) => {
  // 1. UI-Login als Host (setzt die Auth-Cookie auf dem Apex).
  await page.goto(`${APEX_URL}/login`);
  await page.fill("#login-email", HOST.email);
  await page.fill("#login-password", HOST.password);
  await page.locator("#login-password").press("Enter");
  await expect(page.getByText(/^Events$/).first()).toBeVisible({ timeout: 15_000 });

  // 2. Event anlegen (authed, /api/write mit CSRF aus dem Cookie).
  const eventId = await page.evaluate(async (slug) => {
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
      body: JSON.stringify({
        type: "showpony:write:event:create",
        payload: {
          title: "Sommerfest im Hof",
          slug,
          startsAt: "2026-07-18T18:00:00.000Z",
          location: "Innenhof, Berlin-Kreuzberg",
          description: "Grill, Musik, kalte Limo. Bring gern jemanden mit!",
          guestLimit: 60,
        },
      }),
    });
    const body = (await res.json()) as { isSuccess: boolean; data?: { id: string } };
    return body.isSuccess ? (body.data?.id ?? null) : null;
  }, DEMO_SLUG);
  expect(eventId).toBeTruthy();

  // 3. Auf die Event-Projektion warten.
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const res = await fetch("/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ type: "showpony:query:event:list", payload: {} }),
          });
          const body = (await res.json()) as { data?: { rows?: unknown[] } };
          return body.data?.rows?.length ?? 0;
        }),
      { timeout: 15_000 },
    )
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
          body: JSON.stringify({
            type: "showpony:write:rsvp:submit",
            payload: { eventId, ...guest },
          }),
        });
      },
      { eventId, guest },
    );
  }
  await anon.close();

  // 5. Auf die RSVP-Projektion warten (authed gelesen).
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const res = await fetch("/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ type: "showpony:query:rsvp:list", payload: {} }),
          });
          const body = (await res.json()) as { data?: { rows?: unknown[] } };
          return body.data?.rows?.length ?? 0;
        }),
      { timeout: 15_000 },
    )
    .toBeGreaterThanOrEqual(GUESTS.length);

  // 6. Login-State sichern (der Apex-Cookie steckt im page-Context).
  await mkdir("e2e/screenshots/.auth", { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
