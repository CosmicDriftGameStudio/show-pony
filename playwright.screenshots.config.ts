// Screenshot-Runner für die Tutorial-Bilder. Bootet den dev-server gegen
// eine ephemere DB (KUMIKO_DEV_DB_NAME=""), loggt als Host ein + seedet
// ein Demo-Event mit Gästen (setup-Projekt), dann knipst das shots-Projekt
// die Pages. PNGs → docs/screenshots/ (override via SCREENSHOT_DIR).
//
// Regenerierbar: `bun run screenshots`. Bild bleibt synchron zum Code.

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
    locale: "de-DE",
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
  ],
  webServer: {
    command: "bun --env-file=../.env run bin/server.ts",
    url: `http://localhost:${PORT}/`,
    env: { PORT: String(PORT), KUMIKO_DEV_DB_NAME: "" },
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
