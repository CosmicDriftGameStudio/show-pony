// Browser entry for the show-pony host dashboard. createKumikoApp handles
// the auth gate (emailPasswordClient = login form + session) and screen routing
// itself; we only pass in the shell and features.

import { emailPasswordClient } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/web";
import { createKumikoApp } from "@cosmicdrift/kumiko-renderer-web";
import { AppShell } from "./shell";
import { showPonyClient } from "./web";

createKumikoApp({
  shell: AppShell,
  clientFeatures: [emailPasswordClient(), showPonyClient],
});
