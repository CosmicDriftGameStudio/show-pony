// AppShell für show-pony. DefaultAppShell mit Brand-Wortmarke — die Nav
// + die entityList/entityEdit-Screens rendert das Framework selbst aus
// dem Schema.

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
