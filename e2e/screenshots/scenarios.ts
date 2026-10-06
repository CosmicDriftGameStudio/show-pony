// Screenshot scenarios for the tutorial. Each flow seeds its own tenant via
// the `seedTenant` fixture (no shared login/seed state, safe under parallel
// workers) and navigates before runMatrix captures it.

import type { Page } from "@playwright/test";
import { expect, type Scenario, type ScenarioFixtures } from "@cosmicdrift/kumiko-testing/e2e";
import { DEMO_TENANT_NAME, type DemoHostTenant, seedDemoHostTenant } from "../seeds/demo-host";
import { APEX_URL, publicEventUrl } from "./constants";
import {
  seedAcmeBranding,
  seedDemoBranding,
  seedOffsiteEvent,
  seedRooftopEvent,
  seedRooftopGuests,
} from "./seed";

async function loginDemoHost(page: Page, fixtures: ScenarioFixtures): Promise<DemoHostTenant> {
  const demo = await seedDemoHostTenant(fixtures.seedTenant);
  fixtures.presentIdentities(demo.identities);
  await demo.tenant.loginAs(page, demo.host);
  return demo;
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
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
      await seedRooftopEvent(tenant.apiAs(host));
      await page.goto(`${APEX_URL}/host/event-list`);
      await expect(page.getByText("Rooftop Launch Party").first()).toBeVisible();
    },
  },
  {
    name: "host-event-form",
    description: "Empty event form — schema-driven sections and typed fields",
    flow: async (page, fixtures) => {
      await loginDemoHost(page, fixtures);
      await page.goto(`${APEX_URL}/host/event-edit`);
      await expect(page.locator("form input").first()).toBeVisible();
    },
  },
  {
    name: "host-event-edit",
    description: "Edit an existing event — title, slug, and description filled in",
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
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
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
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
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
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
    description: "Platform workspace — sysadmin sees operator overview on the apex",
    // KPI values are installation-wide counts (they change with every parallel
    // seed or earlier run), so they are hidden for the capture only.
    captureStyle: `
      [data-testid^="dashboard-panel-kpi-"] .tabular-nums {
        visibility: hidden;
      }
    `,
    flow: async (page, { seedTenant, presentIdentities }) => {
      const tenant = await seedTenant({ name: DEMO_TENANT_NAME });
      const sysadmin = await tenant.addUser(["SystemAdmin"], {
        displayName: "Platform Operator",
        email: "sysadmin-{tenantId}@show-pony.example",
      });
      presentIdentities([{ from: sysadmin.email, to: "sysadmin@show-pony.local" }]);
      await tenant.loginAs(page, sysadmin);
      await page.goto(`${APEX_URL}/platform/platform-overview`);
      await expect(page.getByTestId("dashboard-platform-overview")).toBeVisible();
    },
  },
  {
    name: "public-event",
    description: "Public invite page — hero, event copy, and RSVP form",
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
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
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
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
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
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

// German-only, default-light-only — the billing dashboard has no fixed
// chrome to worry about, this just keeps the tutorial's German billing
// screenshots to one deterministic capture each instead of doubling
// through DEFAULT_THEMES/all locales like THEMEABLE_SCENARIOS.
export const BILLING_SCENARIOS: readonly Scenario[] = [
  {
    name: "billing-no-subscription",
    description: "Billing screen — no subscription yet, both plans open for checkout",
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
      const event = await seedRooftopEvent(tenant.apiAs(host));
      await seedRooftopGuests(tenant.key, event.id);
      await page.goto(`${APEX_URL}/host/billing`);
      await expect(page.getByTestId("billing-plans-panel")).toBeVisible();
      // Free tier's 1-event cap — the single seeded event already sits at
      // the limit, so the upgrade hint is visible below the usage counter.
      await expect(page.getByTestId("cap-counter-events-upgrade")).toBeVisible();
    },
  },
  {
    name: "billing-active",
    description: "Billing screen — active starter subscription, pro offered as a switch",
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
      const event = await seedRooftopEvent(tenant.apiAs(host));
      await seedRooftopGuests(tenant.key, event.id);
      await tenant.seed("billing-subscription", { tier: "starter", status: "active" });
      await page.goto(`${APEX_URL}/host/billing`);
      await expect(page.getByTestId("billing-plans-panel")).toBeVisible();
      await expect(page.getByTestId("billing-plan-card-starter")).toBeVisible();
    },
  },
  {
    name: "billing-canceled",
    description:
      "Billing screen — subscription with a scheduled cancellation, cancel-scheduled banner visible",
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
      const event = await seedRooftopEvent(tenant.apiAs(host));
      await seedRooftopGuests(tenant.key, event.id);
      await tenant.seed("billing-subscription", { tier: "pro", status: "cancelScheduled" });
      await page.goto(`${APEX_URL}/host/billing`);
      await expect(page.getByTestId("billing-plans-panel")).toBeVisible();
      await expect(page.getByTestId("billing-plans-panel-cancel-scheduled")).toBeVisible();
      await expect(
        page.getByTestId("billing-plan-card-pro").getByRole("button", { name: "Abo reaktivieren" }),
      ).toBeVisible();
    },
  },
  {
    name: "billing-disabled",
    description: "Billing screen — Stripe checkout disabled on this instance",
    flow: async (page, fixtures) => {
      const { tenant, host } = await loginDemoHost(page, fixtures);
      const event = await seedRooftopEvent(tenant.apiAs(host));
      await seedRooftopGuests(tenant.key, event.id);
      await tenant.seed("billing-disabled");
      await page.goto(`${APEX_URL}/host/billing`);
      await expect(page.getByTestId("billing-plans-panel-disabled")).toBeVisible();
      await expect(page.getByTestId("cap-counter-events")).toBeVisible();
      await expect(page.getByTestId("cap-counter-events-upgrade")).toHaveCount(0);
    },
  },
];
