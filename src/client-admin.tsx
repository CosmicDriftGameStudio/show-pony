// Browser entry for the show-pony host dashboard. createKumikoApp handles
// the auth gate (emailPasswordClient = login form + session) and screen routing
// itself; we only pass in the shell and features.

import { adminShellClient } from "@cosmicdrift/kumiko-bundled-features/admin-shell/web";
import { auditClient } from "@cosmicdrift/kumiko-bundled-features/audit/web";
import { emailPasswordClient } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/web";
import { jobsClient } from "@cosmicdrift/kumiko-bundled-features/jobs/web";
import { tenantClient } from "@cosmicdrift/kumiko-bundled-features/tenant/web";
import { createKumikoApp } from "@cosmicdrift/kumiko-renderer-web";
import { AppShell } from "./app/shell";
import { appShellClient } from "./features/app-shell/client";
import { showPonyClient } from "./features/show-pony/web";

createKumikoApp({
  shell: AppShell,
  clientFeatures: [
    emailPasswordClient(),
    adminShellClient(),
    appShellClient,
    tenantClient(),
    auditClient(),
    jobsClient(),
    showPonyClient,
  ],
});
