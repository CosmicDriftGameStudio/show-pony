import { defineConfig, devices } from "@playwright/test";
import { APEX_URL, PORT } from "./e2e/screenshots/constants";

export default defineConfig({
  testDir: "./e2e/loops",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  use: {
    baseURL: APEX_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth-and-seed\.setup\.ts$/, testDir: "./e2e/screenshots" },
    {
      name: "loops",
      testMatch: /loops\.spec\.ts$/,
      dependencies: ["setup"],
      // No global storageState — 02-login records a fresh sign-in; 06 passes it per-context.
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun --env-file=.env run bin/server.ts",
    url: `http://localhost:${PORT}/`,
    env: { PORT: String(PORT), KUMIKO_DEV_DB_NAME: "" },
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});
