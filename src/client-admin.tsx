// Browser entry for the show-pony host dashboard. createKumikoApp handles
// the auth gate (emailPasswordClient = login form + session) and screen routing
// itself; we only pass in the shell and features.

import { adminShellClient } from "@cosmicdrift/kumiko-bundled-features/admin-shell/web";
import { auditClient } from "@cosmicdrift/kumiko-bundled-features/audit/web";
import {
  AuthShellProvider,
  emailPasswordClient,
} from "@cosmicdrift/kumiko-bundled-features/auth-email-password/web";
import { configClient } from "@cosmicdrift/kumiko-bundled-features/config/web";
import { jobsClient } from "@cosmicdrift/kumiko-bundled-features/jobs/web";
import { tenantClient } from "@cosmicdrift/kumiko-bundled-features/tenant/web";
import { tierEngineClient } from "@cosmicdrift/kumiko-bundled-features/tier-engine/web";
import type { ClientFeatureDefinition } from "@cosmicdrift/kumiko-renderer-web";
import { createKumikoApp } from "@cosmicdrift/kumiko-renderer-web";
import { AppShell } from "./app/shell";
import { DemoLoginHint } from "./demo-mode-ui";
import { appShellClient } from "./features/app-shell/client";
import { showPonyClient } from "./features/show-pony/web";
import { MarketingShell } from "./marketing/MarketingShell";

const marketingAuthShell: ClientFeatureDefinition = {
  name: "marketing-auth-shell",
  gates: [
    ({ children }) => (
      <AuthShellProvider shell={(card) => <MarketingShell>{card}</MarketingShell>}>
        {children}
      </AuthShellProvider>
    ),
  ],
};

createKumikoApp({
  shell: AppShell,
  clientFeatures: [
    marketingAuthShell,
    emailPasswordClient({
      loginScreenProps: { subtitle: <DemoLoginHint /> },
    }),
    configClient({
      translations: {
        de: {
          "subscription-stripe.settings": "Stripe",
          "subscription-stripe.api-key": "Stripe API Key",
          "subscription-stripe.webhook-secret": "Stripe Webhook Secret",
          "subscription-stripe.billing-live": "Stripe Billing live",
        },
        en: {
          "subscription-stripe.settings": "Stripe",
          "subscription-stripe.api-key": "Stripe API Key",
          "subscription-stripe.webhook-secret": "Stripe Webhook Secret",
          "subscription-stripe.billing-live": "Stripe Billing Live",
        },
      },
    }),
    adminShellClient(),
    appShellClient,
    tenantClient(),
    tierEngineClient(),
    auditClient(),
    jobsClient(),
    showPonyClient,
  ],
});
