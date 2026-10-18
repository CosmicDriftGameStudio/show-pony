// Shared demo-mode UI (admin bundle).

import { useLocale, useTranslation } from "@cosmicdrift/kumiko-renderer";
import { type ReactElement, useEffect, useState } from "react";
import { fetchDemoMode } from "./demo-mode-client";
import {
  DEMO_ACCOUNT_LABELS,
  type DemoModePayload,
  findDemoLinkHref,
  TUTORIAL_LINK_LABEL,
} from "./demo-mode-notice";

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

  if (!demo?.readOnly || demo.notice.accounts.length === 0) return null;

  return (
    <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-3 text-left text-sm">
      <p className="font-medium text-[var(--color-foreground)]">{t("showpony:demo.login.title")}</p>
      <p className="mt-1 text-[var(--color-muted-foreground)]">{t("showpony:demo.login.body")}</p>
      <ul className="mt-2 space-y-2">
        {demo.notice.accounts.map((account) => (
          <li
            key={account.role}
            className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5"
          >
            <div className="text-xs font-medium text-[var(--color-muted-foreground)]">
              {localeLabel(DEMO_ACCOUNT_LABELS[account.role], locale)}
            </div>
            <div className="font-mono text-xs">
              {account.email} / {account.password}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
        {t("showpony:demo.login.read-only")}
      </p>
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
  const tutorialUrl = findDemoLinkHref(demo, TUTORIAL_LINK_LABEL);

  return (
    <div
      className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/50 px-4 py-2 text-center text-sm text-[var(--color-foreground)]"
      role="status"
    >
      {t("showpony:demo.banner")}{" "}
      {tutorialUrl !== undefined && (
        <a href={tutorialUrl} className="font-medium underline underline-offset-2">
          {t("showpony:demo.banner.link")}
        </a>
      )}
    </div>
  );
}
