// One-off stack check: calendar link must sit below the hero and receive
// clicks. Runs under the loops config (bun run e2e) — not the screenshots
// suite, kept self-contained on purpose (see e2e/loops/env.ts's comment on
// why loops stays decoupled from e2e/screenshots).
import { BRANDING_QN } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { type E2eSeededTenant, expect, test } from "@cosmicdrift/kumiko-testing/e2e";
import type { Page } from "@playwright/test";
import { INVITE_BRANDING_QN } from "../src/features/show-pony/invite-branding.shared";
import { publicEventUrl } from "./loops/env";

type Api = ReturnType<E2eSeededTenant["apiAs"]>;

async function seedInviteEvent(
  tenant: E2eSeededTenant,
  style: "immersive" | "split",
  heroUrl: string,
  brandTitle: string,
  description: string,
): Promise<{ slug: string }> {
  const host = await tenant.addUser(["Admin", "TenantAdmin"]);
  const api: Api = tenant.apiAs(host);
  await api.writeOk("config:write:set", { key: BRANDING_QN.title, value: brandTitle });
  await api.writeOk("config:write:set", { key: INVITE_BRANDING_QN.heroImageUrl, value: heroUrl });
  await api.writeOk("config:write:set", { key: INVITE_BRANDING_QN.heroStyle, value: style });
  const slug = "invite-stack-check";
  await api.writeOk("showpony:write:event:create", {
    title: "Invite Stack Check",
    slug,
    startsAt: "2026-10-03T18:00:00.000Z",
    location: "Test HQ",
    description,
    guestLimit: 10,
  });
  return { slug };
}

async function assertCalendarNotUnderHero(page: Page): Promise<void> {
  const calendar = page.getByRole("link", { name: /calendar/i });
  await expect(calendar).toBeVisible();

  const header = page.locator("header").first();
  await expect(header).toBeVisible();

  const calBox = await calendar.boundingBox();
  const heroBox = await header.boundingBox();
  expect(calBox, "calendar bounding box").toBeTruthy();
  expect(heroBox, "hero bounding box").toBeTruthy();

  // Calendar must start below the header (no vertical overlap).
  expect(calBox!.y).toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height - 2);

  // Real hit-testing: the link must be the top element at its own center,
  // not visually covered by the hero/gradient/overlay stack.
  const centerX = calBox!.x + calBox!.width / 2;
  const centerY = calBox!.y + calBox!.height / 2;
  const isTopElement = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest("a") !== null,
    { x: centerX, y: centerY },
  );
  expect(isTopElement, "calendar link must be the top element at its center").toBe(true);
  await expect(calendar).toBeEnabled();
}

test("demo — calendar below immersive hero", async ({ page, seedTenant }) => {
  const tenant = await seedTenant();
  const { slug } = await seedInviteEvent(
    tenant,
    "immersive",
    "/heroes/demo-rooftop.webp",
    "Mira Events",
    "✨ You're on the list for something special.",
  );
  await page.goto(publicEventUrl(tenant.key, slug));
  await expect(page.getByText("Mira Events").first()).toBeVisible();
  await expect(page.getByText("You're on the list").first()).toBeVisible();
  await assertCalendarNotUnderHero(page);
});

test("acme — calendar below split hero", async ({ page, seedTenant }) => {
  const tenant = await seedTenant();
  const { slug } = await seedInviteEvent(
    tenant,
    "split",
    "/heroes/acme-studio.webp",
    "Acme Studios",
    "\u{1F3A8} Team offsite season is here!",
  );
  await page.goto(publicEventUrl(tenant.key, slug));
  await expect(page.getByText("Acme Studios").first()).toBeVisible();
  await expect(page.getByText("Team offsite season").first()).toBeVisible();
  await assertCalendarNotUnderHero(page);
});

test("acme mobile — calendar below stacked hero image", async ({ page, seedTenant }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const tenant = await seedTenant();
  const { slug } = await seedInviteEvent(
    tenant,
    "split",
    "/heroes/acme-studio.webp",
    "Acme Studios",
    "\u{1F3A8} Team offsite season is here!",
  );
  await page.goto(publicEventUrl(tenant.key, slug));
  await expect(page.getByRole("heading", { name: /Invite Stack Check/i })).toBeVisible();
  await assertCalendarNotUnderHero(page);
});
