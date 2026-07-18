// Screenshot runner for tutorial images. Boots the dev server against an
// ephemeral DB (KUMIKO_DEV_DB_NAME=""), logs in as host and seeds a demo
// event with guests (setup project), then the shots project captures the
// pages. PNGs → docs/screenshots/ (override via SCREENSHOT_DIR).
//
// Regeneratable: `bun run screenshots`. Images stay in sync with the code.

import { defineConfig, devices } from "@playwright/test";
import { APEX_URL, PORT, STORAGE_STATE } from "./e2e/screenshots/constants";

export default defineConfig({
  testDir: "./e2e/screenshots",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: APEX_URL,
    locale: "en-US",
    trace: "retain-on-failure",
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  },
  projects: [
    { name: "setup", testMatch: /auth-and-seed\.setup\.ts$/ },
    {
      name: "shots",
      testMatch: /screenshots\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
    },
    {
      name: "verify",
      testMatch: /verify-invite-stack\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun --env-file=.env run bin/server.ts",
    url: `http://localhost:${PORT}/`,
    env: {
      PORT: String(PORT),
      KUMIKO_DEV_DB_NAME: "",
      // Dev-Fallback: secrets-Feature hat keinen Hardcoded-Default
      // (createEnvMasterKeyProvider wirft ohne _V1). Ephemere DB, nie Prod.
      // Gleicher Key wie publicstatus/money-horse/kumiko-studio Playwright-Boots.
      KUMIKO_SECRETS_MASTER_KEY_V1: "a3VtaWtvLXNjcmVlbnNob3QtZGV2LW1hc3Rlci0zMmI=",
      KUMIKO_SECRETS_MASTER_KEY_CURRENT_VERSION: "1",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
