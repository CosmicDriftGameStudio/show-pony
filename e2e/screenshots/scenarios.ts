// Screenshot scenarios for the tutorial. Each entry navigates via a flow
// function (money-horse pattern) so screens can be filled before capture.

import { expect, type Page } from "@playwright/test";
import { ACME_SLUG, APEX_URL, DEMO_SLUG, acmePublicEventUrl, publicEventUrl } from "./constants";

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
    description: "Host login in marketing chrome at /login — post-mount gate before chapter 12 landing",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(`${APEX_URL}/login`);
      await expect(page.getByRole("link", { name: "Show Pony" }).first()).toBeVisible();
      await expect(page.locator("#login-email")).toBeVisible();
      await expect(page.locator("#login-password")).toBeVisible();
    },
    settleMs: 300,
  },
  {
    name: "apex-landing",
    description: "Marketing landing on apex / (English default)",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(`${APEX_URL}/`);
      await expect(page.getByRole("heading", { name: /Your event/i })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("link", { name: /Login/i }).first()).toBeVisible();
    },
    settleMs: 400,
  },
  {
    name: "apex-features",
    description: "Marketing features tour page",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(`${APEX_URL}/features`);
      await expect(page.getByRole("heading", { name: /How Show Pony works/i })).toBeVisible({
        timeout: 15_000,
      });
    },
    settleMs: 400,
  },
  {
    name: "apex-pricing",
    description: "Marketing pricing page",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(`${APEX_URL}/pricing`);
      await expect(page.getByRole("heading", { name: /Plans for growing hosts/i }).first()).toBeVisible({
        timeout: 15_000,
      });
    },
    settleMs: 400,
  },
  {
    name: "legal-imprint",
    description: "Legal imprint in marketing chrome",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(`${APEX_URL}/legal/imprint`);
      await expect(page).toHaveTitle(/Imprint · Show Pony/i, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: /Provider|Imprint/i }).first()).toBeVisible({
        timeout: 15_000,
      });
    },
    settleMs: 400,
  },
  {
    name: "host-events",
    description: "Host dashboard — seeded Rooftop Launch on the demo tenant",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/host/event-list`);
      await expect(page.getByText("Rooftop Launch Party").first()).toBeVisible({ timeout: 15_000 });
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
      await expect(page.getByRole("heading", { name: /Edit event|Event bearbeiten/i })).toBeVisible({
        timeout: 10_000,
      });
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
    name: "host-invite-branding",
    description: "Invite branding settings — tenant-scoped hero + accent on public invites",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/host/invite-branding-settings`);
      await expect(page.getByRole("heading", { name: /Invite branding/i })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole("textbox", { name: /Brand name/i })).toHaveValue("Mira Events");
      await expect(page.getByRole("textbox", { name: /Hero image URL/i })).toHaveValue(
        "/heroes/demo-rooftop.webp",
      );
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
      await expect(page.getByText("Mira Events").first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
    },
    settleMs: 500,
  },
  {
    name: "public-acme-event",
    description: "Acme tenant invite — separate subdomain, separate guest list",
    clearAuth: true,
    flow: async (page) => {
      await page.goto(acmePublicEventUrl(ACME_SLUG));
      await expect(page.getByText("Acme Studios").first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("heading", { name: /Acme Offsite/i })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Acme HQ/i).first()).toBeVisible();
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
      const yesButton = page.getByRole("button", { name: /I'm in|Ich komme/ });
      await yesButton.click();
      await expect(yesButton).toHaveAttribute("aria-pressed", "true");
    },
    settleMs: 400,
  },
];
