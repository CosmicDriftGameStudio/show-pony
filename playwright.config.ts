// Animated loops for tutorial chapters (docs.kumiko.rocks). Each test seeds its
// own tenant (kumiko-testing seedTenant) and records its own GIF — no shared
// login/seed state with the screenshot runner. Local: `bun run loops`.
import { defineAppE2eConfig } from "@cosmicdrift/kumiko-testing/e2e";
import { PORT } from "./e2e/loops/env";

export default defineAppE2eConfig({
  port: PORT,
  serverEntry: "bin/server.ts",
  locale: "en",
  env: { BASE_DOMAIN: "localhost" }, // hostDispatch only treats BASE_DOMAIN as the apex host
});
