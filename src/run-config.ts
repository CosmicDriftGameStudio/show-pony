// Single source of truth for show-pony feature composition.
// Both bin/server.ts (dev) and the kumiko-schema CLI build on this,
// so the runtime registry and generated schema never drift apart.
//
// HAS_AUTH=true → composeFeatures automatically pulls in the bundled auth chain
// (config/user/tenant/auth-email-password/secrets).

import { createAdminShellFeature } from "@cosmicdrift/kumiko-bundled-features/admin-shell";
import { createAuthFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/auth-foundation";
import {
  createChannelEmailFeature,
  createInMemoryTransport,
} from "@cosmicdrift/kumiko-bundled-features/channel-email";
import { createComplianceProfilesFeature } from "@cosmicdrift/kumiko-bundled-features/compliance-profiles";
import { createDeliveryFeature } from "@cosmicdrift/kumiko-bundled-features/delivery";
import { createHostRoutingFeature } from "@cosmicdrift/kumiko-bundled-features/host-routing";
import { createJobsFeature } from "@cosmicdrift/kumiko-bundled-features/jobs";
import { createLegalPagesFeature } from "@cosmicdrift/kumiko-bundled-features/legal-pages";
import { createManagedPagesFeature } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import {
  createMetricsFeature,
  createSystemMetricsFeature,
  DEFAULT_METRICS,
} from "@cosmicdrift/kumiko-bundled-features/metrics";
import { createReadinessFeature } from "@cosmicdrift/kumiko-bundled-features/readiness";
import { createSecretsFeature } from "@cosmicdrift/kumiko-bundled-features/secrets";
import { templateEditAccess } from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import { createTenantLifecycleFeature } from "@cosmicdrift/kumiko-bundled-features/tenant-lifecycle";
import { createTierEngineFeature } from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import {
  composeRendererStack,
  composeSecurityStack,
} from "@cosmicdrift/kumiko-dev-server/compose-stacks";
import { createDocumentDesignerFeature } from "@cosmicdrift/kumiko-document-designer";
import type { FeatureDefinition } from "@cosmicdrift/kumiko-framework/engine";
import { localeDe } from "@cosmicdrift/kumiko-locale-de";
import { appShellFeature } from "./features/app-shell/feature";
import { createShowPonyBillingFoundationFeature } from "./features/show-pony/billing/plan-catalog";
import { showPonyFeature } from "./features/show-pony/feature";
import { TENANT_EDITABLE_TEMPLATES } from "./features/show-pony/tenant-editable-templates";
import { DEFAULT_TIER, SHOWPONY_TIER_MAP } from "./features/show-pony/tier-map";
import { showPonyLegalLayout } from "./marketing/layouts/legal";
import { resolveSubdomainPageTenant, showPonyHostRoutingOptions } from "./tenant-routing";

/** Overview screens + nav only — app-shell owns workspaces host/platform. */
const adminShellFeature = createAdminShellFeature({
  registerWorkspaces: false,
  includeTierAdmin: true,
  metrics: DEFAULT_METRICS,
});

export type AppFeaturesRouting = {
  readonly baseDomain: string;
  /** Absolute origin the billing-plans catalog redirects back to after
   *  checkout/portal — defaults to `https://${baseDomain}` when omitted. */
  readonly appBaseUrl?: string;
};

/** $BASE_DOMAIN or show-pony.localhost — the one place that default lives. */
export function resolveBaseDomainFromEnv(
  env: Record<string, string | undefined> = process.env,
): string {
  return env["BASE_DOMAIN"] ?? "show-pony.localhost";
}

export function buildAppFeatures(routing: AppFeaturesRouting): FeatureDefinition[] {
  return [
    localeDe(),
    createAuthFoundationFeature(),
    ...composeSecurityStack(),
    createHostRoutingFeature(showPonyHostRoutingOptions(routing.baseDomain)),
    ...composeRendererStack({ templateResolver: { tenantEditable: TENANT_EDITABLE_TEMPLATES } }),
    createDocumentDesignerFeature({ access: templateEditAccess(TENANT_EDITABLE_TEMPLATES) }),
    createLegalPagesFeature({ wrapLayout: showPonyLegalLayout, terms: true }),
    createManagedPagesFeature({
      resolveApexTenant: resolveSubdomainPageTenant,
      allowCustomCss: false,
    }),
    createDeliveryFeature(),
    // Guests are addressed by the email they typed, so no user lookup exists.
    // The in-memory transport keeps the demo behaviour: no RSVP mail leaves the process.
    createChannelEmailFeature({
      transport: createInMemoryTransport(),
      resolveEmail: async () => null,
    }),
    createJobsFeature(),
    createTierEngineFeature({ defaultTier: DEFAULT_TIER, tierMap: SHOWPONY_TIER_MAP }),
    createComplianceProfilesFeature(),
    createTenantLifecycleFeature(),
    createShowPonyBillingFoundationFeature(routing.appBaseUrl ?? `https://${routing.baseDomain}`),
    createSecretsFeature(),
    createMetricsFeature({ metrics: DEFAULT_METRICS }),
    createSystemMetricsFeature({ metrics: DEFAULT_METRICS }),
    // No nav option: showpony and app-shell file the entries per workspace, gated to TenantAdmin / SystemAdmin.
    createReadinessFeature(),
    adminShellFeature,
    appShellFeature,
    showPonyFeature,
  ];
}

export const HAS_AUTH = true;
