import { defineAppConfig } from "@cosmicdrift/kumiko-framework/config";
import { SHOW_PONY_KMS_MODE } from "./src/features/show-pony/billing/billing-option";
import { buildAppFeatures, resolveBaseDomainFromEnv } from "./src/run-config";

export default defineAppConfig({
  features: buildAppFeatures({ baseDomain: resolveBaseDomainFromEnv(process.env) }),
  client: { entries: ["src/client-admin.tsx", "src/client-public.tsx"] },
  ports: { dev: 4180, e2e: 4181 },
  validateBootOptions: { requiredLocales: ["de", "en"] },
  kmsMode: SHOW_PONY_KMS_MODE,
});
