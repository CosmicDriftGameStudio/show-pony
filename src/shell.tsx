// AppShell for show-pony. DefaultAppShell with a brand wordmark — the nav
// and entityList/entityEdit screens are rendered by the framework from
// the schema.

import { type AppSchema, DefaultAppShell } from "@cosmicdrift/kumiko-renderer-web";
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
  return (
    <DefaultAppShell schema={schema} brand={<Brand />}>
      {children}
    </DefaultAppShell>
  );
}
