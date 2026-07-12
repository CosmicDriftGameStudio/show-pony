// AppShell for show-pony — WorkspaceShell with host + platform workspaces.

import { useShellUser } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/web";
import { type AppSchema, WorkspaceShell } from "@cosmicdrift/kumiko-renderer-web";
import type { ReactNode } from "react";
import { DemoReadOnlyBanner } from "../demo-mode-ui";
import { AppTopbarActions } from "./topbar-actions";

const Brand = (): ReactNode => (
  <span className="font-semibold tracking-tight text-[var(--color-primary)]">ShowPony</span>
);

export function AppShell({
  children,
  schema,
}: {
  children: ReactNode;
  schema: AppSchema;
}): ReactNode {
  const user = useShellUser();
  return (
    <>
      <DemoReadOnlyBanner />
      <WorkspaceShell
        brand={<Brand />}
        schema={schema}
        topbarActions={<AppTopbarActions />}
        {...(user !== undefined && { user })}
      >
        {children}
      </WorkspaceShell>
    </>
  );
}


