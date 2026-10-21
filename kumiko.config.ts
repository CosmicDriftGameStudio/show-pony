import { defineAppConfig } from "@cosmicdrift/kumiko-framework/config";
import { buildAppFeatures, resolveBaseDomainFromEnv } from "./src/run-config";

export default defineAppConfig({
  features: buildAppFeatures({ baseDomain: resolveBaseDomainFromEnv() }),
  client: { entries: ["src/client-admin.tsx", "src/client-public.tsx"] },
  ports: { dev: 4180, e2e: 4181 },
  validateBootOptions: { requiredLocales: ["de", "en"] },
});
