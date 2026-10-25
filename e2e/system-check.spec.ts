// The system check as an operator finds it: the host's TenantAdmin under "Account", the platform
// operator in the platform workspace. The run goes through the real worker job, no stubbed result.
import { captureScreenshot, expect, test } from "@cosmicdrift/kumiko-testing/e2e";
import type { Page } from "@playwright/test";
import { APEX_URL } from "./loops/env";

async function startCheck(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "System check", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Start check" }).click();
}

test("a host's TenantAdmin starts the system check under Account", async ({ page, seedTenant }) => {
  const tenant = await seedTenant();
  const host = await tenant.addUser(["Admin", "TenantAdmin"]);
  await tenant.loginAs(page, host);
  await page.goto(`${APEX_URL}/host/event-list`);

  await page.getByText("Account", { exact: true }).click();
  await page.getByRole("link", { name: "System check" }).click();
  await startCheck(page);
  // show-pony mounts no tenant-scoped probe, so the finished run only shows up in the history.
  await expect(page.getByText("No check has run yet.")).toBeHidden({ timeout: 30_000 });
  await expect(page.getByText("No failures")).toBeVisible({ timeout: 30_000 });
  await captureScreenshot(page, "show-pony-0391-tenant-admin", { fit: "content" });
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
  await startCheck(page);
  await expect(page.getByText("Database reachable")).toBeVisible({ timeout: 30_000 });
  await captureScreenshot(page, "show-pony-0391-system-admin", { fit: "content" });
});
