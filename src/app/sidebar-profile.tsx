import { UserMenu } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/web";
import type { ReactNode } from "react";

export function SidebarProfile(): ReactNode {
  return <UserMenu variant="sidebar" />;
}
