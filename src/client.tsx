// Browser-Entry für das show-pony Host-Dashboard. createKumikoApp macht
// Auth-Gate (emailPasswordClient = Login-Maske + Session) + Screen-Routing
// selbst; wir reichen nur Shell + Features rein.

import { emailPasswordClient } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/web";
import { createKumikoApp } from "@cosmicdrift/kumiko-renderer-web";
import { AppShell } from "./shell";
import { showPonyClient } from "./web";

createKumikoApp({
  shell: AppShell,
  clientFeatures: [emailPasswordClient(), showPonyClient],
});
