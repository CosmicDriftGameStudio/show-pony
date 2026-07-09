import { defineConfig, devices } from "@playwright/test";
import { APEX_URL, PORT, STORAGE_STATE } from "./e2e/screenshots/constants";

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
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
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
