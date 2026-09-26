// Screenshot scenarios for the tutorial. Each flow seeds its own tenant via
// the `seedTenant` fixture (no shared login/seed state, safe under parallel
// workers) and navigates before runMatrix captures it.

import type { Page } from "@playwright/test";
import { type E2eSeededTenant, expect, type Scenario } from "@cosmicdrift/kumiko-testing/e2e";
import { APEX_URL, publicEventUrl } from "./constants";
import {
  seedAcmeBranding,
  seedDemoBranding,
  seedOffsiteEvent,
  seedRooftopEvent,
  seedRooftopGuests,
} from "./seed";

async function loginHost(page: Page, tenant: E2eSeededTenant): ReturnType<E2eSeededTenant["addUser"]> {
  const host = await tenant.addUser(["Admin", "TenantAdmin"]);
  await tenant.loginAs(page, host);
  return host;
}

// Fixed dark brand chrome (marketing.ts / legal-layout.ts) — these four don't
// react to .dark, so they're captured with THEMES = ["default-light"] only.
export const FIXED_CHROME_SCENARIOS: readonly Scenario[] = [
  {
    name: "apex-landing",
    description: "Marketing landing on apex / (English default)",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/`);
      await expect(page.getByRole("heading", { name: /Your event/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Login/i }).first()).toBeVisible();
    },
  },
  {
    name: "apex-features",
    description: "Marketing features tour page",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/features`);
      await expect(page.getByRole("heading", { name: /How Show Pony works/i })).toBeVisible();
    },
  },
  {
    name: "apex-pricing",
    description: "Marketing pricing page",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/pricing`);
      await expect(page.getByRole("heading", { name: /Plans for growing hosts/i }).first()).toBeVisible();
    },
  },
  {
    name: "legal-imprint",
    description: "Legal imprint in marketing chrome",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/legal/imprint`);
      await expect(page).toHaveTitle(/Imprint · Show Pony/i);
      await expect(page.getByRole("heading", { name: /Provider|Imprint/i }).first()).toBeVisible();
    },
  },
];

export const THEMEABLE_SCENARIOS: readonly Scenario[] = [
  {
    name: "host-login",
    description: "Host login in marketing chrome at /login — post-mount gate before chapter 12 landing",
    flow: async (page) => {
      await page.goto(`${APEX_URL}/login`);
      await expect(page.getByRole("link", { name: "Show Pony" }).first()).toBeVisible();
      await expect(page.locator("#login-email")).toBeVisible();
      await expect(page.locator("#login-password")).toBeVisible();
    },
  },
  {
    name: "host-events",
    description: "Host dashboard — seeded Rooftop Launch on the demo tenant",
    flow: async (page, { seedTenant }) => {
      const tenant = await seedTenant();
      const host = await loginHost(page, tenant);
      await seedRooftopEvent(tenant.apiAs(host));
      await page.goto(`${APEX_URL}/host/event-list`);
      await expect(page.getByText("Rooftop Launch Party").first()).toBeVisible();
    },
  },
  {
    name: "host-event-form",
    description: "Empty event form — schema-driven sections and typed fields",
    flow: async (page, { seedTenant }) => {
      const tenant = await seedTenant();
      await loginHost(page, tenant);
      await page.goto(`${APEX_URL}/host/event-edit`);
      await expect(page.locator("form input").first()).toBeVisible();
    },
  },
  {
    name: "host-event-edit",
    description: "Edit an existing event — title, slug, and description filled in",
    flow: async (page, { seedTenant }) => {
      const tenant = await seedTenant();
      const host = await loginHost(page, tenant);
      await seedRooftopEvent(tenant.apiAs(host));
      await page.goto(`${APEX_URL}/host/event-list`);
      await expect(page.getByText("Rooftop Launch Party").first()).toBeVisible();
      await page.getByRole("row", { name: /Rooftop Launch Party/ }).click();
      await expect(page.getByRole("heading", { name: /Edit event|Event bearbeiten/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Title/i })).toHaveValue("Rooftop Launch Party");
      await expect(page.getByRole("textbox", { name: /Location/i })).toHaveValue("Sky Lounge, 24th floor");
    },
  },
  {
    name: "host-guests",
    description: "Guest list — anonymous RSVPs with status and plus-ones",
    flow: async (page, { seedTenant }) => {
      const tenant = await seedTenant();
      const host = await loginHost(page, tenant);
      const event = await seedRooftopEvent(tenant.apiAs(host));
      await seedRooftopGuests(tenant.key, event.id);
      await page.goto(`${APEX_URL}/host/rsvp-list`);
      await expect(page.getByText("Ava Chen").first()).toBeVisible();
      await expect(page.getByText("Marcus Bell").first()).toBeVisible();
      await expect(page.getByText("Priya Raman").first()).toBeVisible();
    },
  },
  {
    name: "host-invite-branding",
    description: "Invite branding settings — tenant-scoped hero + accent on public invites",
    flow: async (page, { seedTenant }) => {
      const tenant = await seedTenant();
      const host = await loginHost(page, tenant);
      await seedDemoBranding(tenant.apiAs(host));
      await page.goto(`${APEX_URL}/host/invite-branding-settings`);
      await expect(page.getByRole("heading", { name: /Invite branding/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Brand name/i })).toHaveValue("Mira Events");
      await expect(page.getByRole("textbox", { name: /Hero image URL/i })).toHaveValue(
        "/heroes/demo-rooftop.webp",
      );
    },
  },
  {
    name: "platform-overview",
    // The screen only shows installation-wide tenant/user/failed-job counts,
    // no per-tenant list, so this stays order-dependent under parallel seeding
    // even though the sysadmin here is its own seeded user.
    description: "Platform workspace — sysadmin sees operator overview on the apex",
    flow: async (page, { seedTenant }) => {
      const tenant = await seedTenant();
      const sysadmin = await tenant.addUser(["SystemAdmin"]);
      await tenant.loginAs(page, sysadmin);
      await page.goto(`${APEX_URL}/platform/platform-overview`);
      await expect(page.getByTestId("dashboard-platform-overview")).toBeVisible();
    },
  },
  {
    name: "public-event",
    description: "Public invite page — hero, event copy, and RSVP form",
    flow: async (page, { seedTenant }) => {
      const tenant = await seedTenant();
      const host = await loginHost(page, tenant);
      await seedDemoBranding(tenant.apiAs(host));
      const event = await seedRooftopEvent(tenant.apiAs(host));
      await page.goto(publicEventUrl(tenant.key, event.slug));
      await expect(page.getByText("Mira Events").first()).toBeVisible();
      await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
    },
  },
  {
    name: "public-acme-event",
    description: "Acme tenant invite — separate subdomain, separate guest list",
    flow: async (page, { seedTenant }) => {
      const tenant = await seedTenant();
      const host = await loginHost(page, tenant);
      await seedAcmeBranding(tenant.apiAs(host));
      const event = await seedOffsiteEvent(tenant.apiAs(host));
      await page.goto(publicEventUrl(tenant.key, event.slug));
      await expect(page.getByText("Acme Studios").first()).toBeVisible();
      await expect(page.getByRole("heading", { name: /Acme Offsite/i })).toBeVisible();
      await expect(page.getByText(/Acme HQ/i).first()).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
    },
  },
  {
    name: "public-rsvp-draft",
    description: "Public RSVP — guest name typed, status selected, ready to send",
    flow: async (page, { seedTenant }) => {
      const tenant = await seedTenant();
      const host = await loginHost(page, tenant);
      const event = await seedRooftopEvent(tenant.apiAs(host));
      await page.goto(publicEventUrl(tenant.key, event.slug));
      await expect(page.getByRole("heading", { name: /Rooftop Launch/i })).toBeVisible();
      await page.getByRole("textbox", { name: "Name" }).fill("Jordan Lee");
      const yesButton = page.getByRole("button", { name: /I'm in|Ich komme/ });
      await yesButton.click();
      await expect(yesButton).toHaveAttribute("aria-pressed", "true");
    },
  },
];
