// AppShell for show-pony — WorkspaceShell with host + platform workspaces.

import {
  DefaultTopbarActions,
  useShellUser,
} from "@cosmicdrift/kumiko-bundled-features/auth-email-password/web";
import { type AppSchema, WorkspaceShell } from "@cosmicdrift/kumiko-renderer-web";
import type { ReactNode } from "react";

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
    <WorkspaceShell
      brand={<Brand />}
      schema={schema}
      topbarActions={<DefaultTopbarActions />}
      {...(user !== undefined && { user })}
    >
      {children}
    </WorkspaceShell>
  );
}
