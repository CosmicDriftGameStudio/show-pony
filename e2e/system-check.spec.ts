// The system check as the platform operator finds it in the platform workspace; the run goes through the
// real worker job, no stubbed result. show-pony has no tenant probes, so the host workspace has no entry.
import { captureScreenshot, expect, test } from "@cosmicdrift/kumiko-testing/e2e";
import { APEX_URL } from "./loops/env";

test("a host's TenantAdmin finds no system check entry under Account", async ({
  page,
  seedTenant,
}) => {
  const tenant = await seedTenant();
  const host = await tenant.addUser(["Admin", "TenantAdmin"]);
  await tenant.loginAs(page, host);
  await page.goto(`${APEX_URL}/host/event-list`);

  await expect(page.getByRole("link", { name: "Plan & billing" })).toBeVisible();
  await expect(page.getByRole("link", { name: "System check" })).toHaveCount(0);
});

test("the platform operator starts the system check in the platform workspace", async ({
  page,
  seedTenant,
}) => {
  const tenant = await seedTenant();
  const operator = await tenant.addUser(["SystemAdmin"]);
  await tenant.loginAs(page, operator);
  await page.goto(`${APEX_URL}/platform/user-list`);

  await page.getByRole("link", { name: "System check" }).click();
  await expect(page.getByRole("heading", { name: "System check", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Start check" }).click();
  await expect(page.getByText("Database reachable")).toBeVisible({ timeout: 30_000 });
  await captureScreenshot(page, "show-pony-0391-system-admin", { fit: "content" });
});
