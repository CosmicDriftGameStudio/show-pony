// One-off stack check: calendar link must sit below the hero and receive clicks.
import { expect, test } from "@playwright/test";
import { ACME_SLUG, DEMO_SLUG, acmePublicEventUrl, publicEventUrl } from "./constants";

async function assertCalendarNotUnderHero(page: import("@playwright/test").Page): Promise<void> {
  const calendar = page.getByRole("link", { name: /calendar/i });
  await expect(calendar).toBeVisible({ timeout: 15_000 });

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

test.describe.configure({ mode: "serial" });

test("demo — calendar below immersive hero", async ({ page }) => {
  await page.goto(publicEventUrl(DEMO_SLUG));
  await expect(page.getByText("Mira Events").first()).toBeVisible();
  await expect(page.getByText("✨ You're on the list").first()).toBeVisible();
  await assertCalendarNotUnderHero(page);
});

test("acme — calendar below split hero", async ({ page }) => {
  await page.goto(acmePublicEventUrl(ACME_SLUG));
  await expect(page.getByText("Acme Studios").first()).toBeVisible();
  await expect(page.getByText("🎨 Team offsite").first()).toBeVisible();
  await assertCalendarNotUnderHero(page);
});

test("acme mobile — calendar below stacked hero image", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(acmePublicEventUrl(ACME_SLUG));
  await expect(page.getByRole("heading", { name: /Acme Offsite/i })).toBeVisible();
  await assertCalendarNotUnderHero(page);
});
