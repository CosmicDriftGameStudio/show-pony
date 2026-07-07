// Topbar without UserMenu — account/logout lives in SidebarProfile (publicstatus pattern).

import { TenantSwitcher } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/web";
import { ThemeToggle } from "@cosmicdrift/kumiko-renderer-web";
import type { ReactNode } from "react";

export function AppTopbarActions(): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <TenantSwitcher />
      <ThemeToggle />
    </div>
  );
}
