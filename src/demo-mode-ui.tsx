// Shared demo-mode UI (admin bundle).

import { useLocale, useTranslation } from "@cosmicdrift/kumiko-renderer";
import { type ReactElement, useEffect, useState } from "react";
import type { DemoModePayload } from "./demo-mode";
import { fetchDemoMode } from "./demo-mode-client";

function localeLabel(entry: { de: string; en: string }, locale: string): string {
  return locale.startsWith("de") ? entry.de : entry.en;
}

export function DemoLoginHint(): ReactElement | null {
  const t = useTranslation();
  const locale = useLocale().locale();
  const [demo, setDemo] = useState<DemoModePayload | null>(null);

  // kumiko-lint-ignore no-raw-hooks login subtitle — one-shot /api/demo-mode
  useEffect(() => {
    void fetchDemoMode().then(setDemo);
  }, []);

  if (!demo?.readOnly || demo.accounts.length === 0) return null;

  return (
    <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-3 text-left text-sm">
      <p className="font-medium text-[var(--color-foreground)]">{t("showpony:demo.login.title")}</p>
      <p className="mt-1 text-[var(--color-muted-foreground)]">{t("showpony:demo.login.body")}</p>
      <ul className="mt-2 space-y-2">
        {demo.accounts.map((account) => (
          <li key={account.role} className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5">
            <div className="text-xs font-medium text-[var(--color-muted-foreground)]">
              {localeLabel(account.label, locale)}
            </div>
            <div className="font-mono text-xs">
              {account.email} / {account.password}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{t("showpony:demo.login.read-only")}</p>
    </div>
  );
}

export function DemoReadOnlyBanner(): ReactElement | null {
  const t = useTranslation();
  const [demo, setDemo] = useState<DemoModePayload | null>(null);

  // kumiko-lint-ignore no-raw-hooks banner — one-shot /api/demo-mode
  useEffect(() => {
    void fetchDemoMode().then(setDemo);
  }, []);

  if (!demo?.readOnly) return null;

  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
      role="status"
    >
      {t("showpony:demo.banner")}{" "}
      <a href={demo.tutorialUrl} className="font-medium underline underline-offset-2">
        {t("showpony:demo.banner.link")}
      </a>
    </div>
  );
}



