// Setup step for the screenshot runner: log in as host, create a demo event
// (authed) + have a few guests RSVP anonymously via the subdomain —
// so the dashboard, guest list, and public page are not empty.
// Saves the login state at the end for the shots project.
//
// Event-sourced: poll the projection after each write (lag). Authed
// requests set X-Tenant explicitly — a raw fetch has no SPA tenant
// switcher to do it automatically.

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
  // 1. UI login as host (sets the auth cookie on the apex).
  await page.goto(`${APEX_URL}/login`);
  await page.fill("#login-email", HOST.email);
  await page.fill("#login-password", HOST.password);
  await page.locator("#login-password").press("Enter");
  await expect(page.getByText(/^Events$/).first()).toBeVisible({ timeout: 15_000 });

  // 2. Create the event.
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

  // 3. Wait for the event projection.
  await expect
    .poll(() => authedCount(page, "showpony:query:event:list"), { timeout: 15_000 })
    .toBeGreaterThan(0);

  // 4. RSVPs anonymously via the subdomain — fresh context without the host cookie,
  //    so the tenant is resolved from the Host header (not from a session).
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

  // 5. Wait for the RSVP projection (read authed).
  await expect.poll(() => authedCount(page, "showpony:query:rsvp:list"), { timeout: 15_000 }).toBeGreaterThanOrEqual(GUESTS.length);

  // 6. Save login state (the apex cookie lives in the page context).
  await mkdir("e2e/screenshots/.auth", { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
