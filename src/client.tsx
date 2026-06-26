// Browser-Entry für das show-pony Host-Dashboard. Ein Feature, shared
// shell, Render über den Framework-Default.

import { createKumikoApp } from "@cosmicdrift/kumiko-renderer-web";
import { AppShell } from "./shell";
import { showPonyClient } from "./web";

createKumikoApp({
  shell: AppShell,
  clientFeatures: [showPonyClient],
});
