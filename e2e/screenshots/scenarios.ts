// Screenshot scenarios for the tutorial. Each entry navigates via a flow
// function (money-horse pattern) so screens can be filled before capture.

import { expect, type Page } from "@playwright/test";
import { APEX_URL, DEMO_SLUG, publicEventUrl } from "./constants";

export interface Scenario {
  readonly name: string;
  readonly description: string;
  readonly settleMs?: number;
  readonly clearAuth?: boolean;
  readonly flow: (page: Page) => Promise<void>;
}

export const SCENARIOS: readonly Scenario[] = [
  {
    name: "host-login",
    description: "Login screen on the apex — before the host enters the dashboard",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(`${APEX_URL}/login`);
      await expect(page.locator("#login-email")).toBeVisible();
      await expect(page.locator("#login-password")).toBeVisible();
    },
    settleMs: 300,
  },
  {
    name: "host-events",
    description: "Host dashboard — seeded event list with two upcoming events",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/host/event-list`);
      await expect(page.getByText("Rooftop Launch Party").first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Winter Warmup Drinks").first()).toBeVisible();
    },
    settleMs: 400,
  },
  {
    name: "host-event-form",
    description: "Empty event form — schema-driven sections and typed fields",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/host/event-edit`);
      await expect(page.locator("form input").first()).toBeVisible();
    },
    settleMs: 400,
  },
  {
    name: "host-event-edit",
    description: "Edit an existing event — title, slug, and description filled in",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/host/event-list`);
      await expect(page.getByText("Rooftop Launch Party").first()).toBeVisible({ timeout: 15_000 });
      await page.getByRole("row", { name: /Rooftop Launch Party/ }).click();
      await expect(page.getByRole("heading", { name: /Edit event/i })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole("textbox", { name: /Title/i })).toHaveValue("Rooftop Launch Party");
      await expect(page.getByRole("textbox", { name: /Location/i })).toHaveValue("Sky Lounge, 24th floor");
    },
    settleMs: 500,
  },
  {
    name: "host-guests",
    description: "Guest list — anonymous RSVPs with status and plus-ones",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/host/rsvp-list`);
      await expect(page.getByText("Ava Chen").first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Marcus Bell").first()).toBeVisible();
      await expect(page.getByText("Priya Raman").first()).toBeVisible();
    },
    settleMs: 400,
  },
  {
    name: "platform-overview",
    description: "Platform workspace — sysadmin sees operator overview on the apex",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(`${APEX_URL}/login`);
      await page.fill("#login-email", "sysadmin@show-pony.local");
      await page.fill("#login-password", "changeme");
      await page.locator("#login-password").press("Enter");
      await expect(page.getByText(/^Events$/).first()).toBeVisible({ timeout: 15_000 });
      await page.getByRole("tab", { name: /^Platform$|^Plattform$/ }).click();
      await expect(page.getByTestId("platform-overview-screen")).toBeVisible({ timeout: 15_000 });
    },
    settleMs: 500,
  },
  {
    name: "public-event",
    description: "Public invite page — hero, event copy, and RSVP form",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(publicEventUrl(DEMO_SLUG));
      await expect(page.getByText("You're invited").first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
    },
    settleMs: 500,
  },
  {
    name: "public-warmup-event",
    description: "Second seeded event — smaller invite, same subdomain routing",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(publicEventUrl("warmup-drinks"));
      await expect(page.getByRole("heading", { name: /Winter Warmup/i })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Ground-floor bar/i).first()).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
    },
    settleMs: 500,
  },
  {
    name: "public-rsvp-draft",
    description: "Public RSVP — guest name typed, status selected, ready to send",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(publicEventUrl(DEMO_SLUG));
      await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible({ timeout: 15_000 });
      await page.getByRole("textbox", { name: "Name" }).fill("Jordan Lee");
      await page.getByRole("button", { name: "I'm in" }).click();
      await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue("Jordan Lee");
    },
    settleMs: 400,
  },
];





