// Side-effect-free half of bin/env.ts: the composed schema without the eager parse,
// so tooling can read it on a partial env.

import { createAuthEmailPasswordFeature } from "@cosmicdrift/kumiko-bundled-features/auth-email-password";
import {
  buildInfoEnvSchema,
  demoAdminEnvSchema,
} from "@cosmicdrift/kumiko-bundled-features/foundation-shared";
import { stripeEnvSchema } from "@cosmicdrift/kumiko-bundled-features/subscription-stripe";
import { frameworkCoreEnvSchema } from "@cosmicdrift/kumiko-dev-server";
import { allAppFeatures } from "@cosmicdrift/kumiko-framework/config";
import { composeEnvSchema } from "@cosmicdrift/kumiko-framework/env";
import { z } from "zod";
import appConfig from "../kumiko.config";

// Same floor as the shared demoAdminEnvSchema; the framework does not export its constant.
export const SEED_PASSWORD_MIN_LENGTH = 16;

const requiredSecret = (description: string) =>
  z
    .string()
    .min(SEED_PASSWORD_MIN_LENGTH)
    .describe(description)
    .meta({ kumiko: { pulumi: { generator: "openssl rand -hex 24", secret: true } } });

// Not owned by any bundled feature. The demo passwords are required here (the shared
// block makes them optional) because the prod seeds log in with them.
const showPonyAppEnv = z.object({
  ...buildInfoEnvSchema.shape,
  ...demoAdminEnvSchema.shape,
  ...stripeEnvSchema({ prices: ["STARTER", "PRO"] }).shape,
  DEMO_ADMIN_PASSWORD: requiredSecret("Password of the seeded demo host (Admin)."),
  DEMO_SYSADMIN_PASSWORD: requiredSecret("Password of the seeded SystemAdmin."),
  BASE_DOMAIN: z
    .string()
    .min(1)
    .describe(
      "Host surface, e.g. show-pony.kumiko.rocks; guest pages live on <key>.<BASE_DOMAIN>.",
    ),
  DEMO_READ_ONLY: z
    .enum(["true", "1", "false", "0"])
    .optional()
    .describe("Live cloud demo: blocks writes and shows the login hints."),
  MEILI_URL: z.url().optional().describe("Meilisearch base URL; unset = in-memory search index."),
  MEILI_MASTER_KEY: z
    .string()
    .min(1)
    .optional()
    .describe("Meilisearch master key. Set together with MEILI_URL.")
    .meta({ kumiko: { pulumi: { secret: true } } }),
  KUMIKO_TRUSTED_PROXY_HOPS: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .describe(
      "Proxies in front of the app (1 behind ingress-nginx); unset makes every guest share one rate-limit bucket.",
    ),
});

/** Composed schema for `runProdApp({ envSchema })`, the boot validation and the
 *  KUMIKO_DRY_RUN_ENV inventory. */
export const showPonyEnvSchema = composeEnvSchema({
  core: frameworkCoreEnvSchema,
  features: [...allAppFeatures(appConfig), createAuthEmailPasswordFeature()],
  extend: showPonyAppEnv,
});

export type ShowPonyEnv = z.infer<typeof showPonyEnvSchema.schema>;
