// Single source of truth for show-pony feature composition.
// Both bin/server.ts (dev) and the kumiko-schema CLI build on this,
// so the runtime registry and generated schema never drift apart.
//
// HAS_AUTH=true → composeFeatures automatically pulls in the bundled auth chain
// (config/user/tenant/auth-email-password/secrets).

import { createAdminShellFeature } from "@cosmicdrift/kumiko-bundled-features/admin-shell";
import { createAuditFeature } from "@cosmicdrift/kumiko-bundled-features/audit";
import { billingFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/billing-foundation";
import { createComplianceProfilesFeature } from "@cosmicdrift/kumiko-bundled-features/compliance-profiles";
import { createJobsFeature } from "@cosmicdrift/kumiko-bundled-features/jobs";
import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { mailTransportInMemoryFeature } from "@cosmicdrift/kumiko-bundled-features/mail-transport-inmemory";
import { createManagedPagesFeature } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { createRateLimitingFeature } from "@cosmicdrift/kumiko-bundled-features/rate-limiting";
import { createSecretsFeature } from "@cosmicdrift/kumiko-bundled-features/secrets";
import { createTenantLifecycleFeature } from "@cosmicdrift/kumiko-bundled-features/tenant-lifecycle";
import { createTierEngineFeature } from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import { composePagesStack } from "@cosmicdrift/kumiko-dev-server/compose-stacks";
import { appShellFeature } from "./features/app-shell/feature";
import { showPonyFeature } from "./features/show-pony/feature";
import { DEFAULT_TIER, SHOWPONY_TIER_MAP } from "./features/show-pony/tier-map";
import { renderLegalLayout } from "./legal-layout";
import { resolveSubdomainPageTenant } from "./tenant-routing";

/** Overview screens + nav only — app-shell owns workspaces host/platform. */
const adminShellFeature = createAdminShellFeature({
  registerWorkspaces: false,
  includeTierAdmin: true,
});

export const APP_FEATURES = [
  ...composePagesStack({ wrapLayout: renderLegalLayout }),
  createManagedPagesFeature({
    resolveApexTenant: resolveSubdomainPageTenant,
    allowCustomCss: false,
  }),
  mailFoundationFeature,
  mailTransportInMemoryFeature,
  createRateLimitingFeature(),
  createAuditFeature(),
  createJobsFeature(),
  createTierEngineFeature({ defaultTier: DEFAULT_TIER, tierMap: SHOWPONY_TIER_MAP }),
  createComplianceProfilesFeature(),
  createTenantLifecycleFeature(),
  billingFoundationFeature,
  createSecretsFeature(),
  adminShellFeature,
  appShellFeature,
  showPonyFeature,
] as const;

export const HAS_AUTH = true;
