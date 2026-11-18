// Shared demo-mode UI (admin bundle).

import { useLocale, usePrimitives, useTranslation } from "@cosmicdrift/kumiko-renderer";
import { useDemoMode } from "@cosmicdrift/kumiko-renderer/web";
import type { ReactElement } from "react";
import { findDemoLinkHref, TUTORIAL_LINK_LABEL } from "./demo-mode-notice";

function localeLabel(entry: Readonly<Record<string, string>>, locale: string): string {
  return (locale.startsWith("de") ? entry["de"] : entry["en"]) ?? "";
}

export function DemoLoginHint(): ReactElement | null {
  const t = useTranslation();
  const locale = useLocale().locale();
  const demo = useDemoMode();

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
              {account.label === undefined ? account.role : localeLabel(account.label, locale)}
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
  const { Link } = usePrimitives();
  const demo = useDemoMode();

  if (!demo?.readOnly) return null;
  const tutorialUrl = findDemoLinkHref(demo, TUTORIAL_LINK_LABEL);

  return (
    <div
      className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/50 px-4 py-2 text-center text-sm text-[var(--color-foreground)]"
      role="status"
    >
      {t("showpony:demo.banner")}{" "}
      {tutorialUrl !== undefined && (
        <Link href={tutorialUrl} className="font-medium text-inherit underline underline-offset-2">
          {t("showpony:demo.banner.link")}
        </Link>
      )}
    </div>
  );
}
