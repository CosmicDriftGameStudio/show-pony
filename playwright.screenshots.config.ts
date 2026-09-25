// Screenshot runner for tutorial images. Each scenario seeds its own tenant
// via the `seedTenant` fixture — no shared setup project, no storage state.
// SCREENSHOT_DIR has no default on purpose (requireScreenshotDir) so a plain
// run never overwrites the committed docs images. Regenerate with:
//   SCREENSHOT_DIR=docs/screenshots bun run screenshots
import { defineAppE2eConfig } from "@cosmicdrift/kumiko-testing/e2e";
import { PORT } from "./e2e/screenshots/constants";

export default defineAppE2eConfig({
  port: PORT,
  serverEntry: "bin/server.ts",
  testDir: "./e2e/screenshots",
  locale: "en",
  env: {
    BASE_DOMAIN: "localhost", // hostDispatch only treats BASE_DOMAIN as the apex host
    // Dev-fallback, not a secret: secrets feature has no hardcoded default
    // (createEnvMasterKeyProvider throws without _V1). Same key as
    // publicstatus/money-horse/kumiko-studio Playwright boots.
    KUMIKO_SECRETS_MASTER_KEY_V1: "a3VtaWtvLXNjcmVlbnNob3QtZGV2LW1hc3Rlci0zMmI=",
    KUMIKO_SECRETS_MASTER_KEY_CURRENT_VERSION: "1",
  },
});
