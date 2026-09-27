import { useLocale, useTranslation } from "@cosmicdrift/kumiko-renderer";
import { ProgressBar } from "@cosmicdrift/kumiko-renderer-web";
import type { ReactNode } from "react";
import type { CapUsage } from "../handlers/usage.query";

export type CapCounterProps = {
  readonly capKey: string;
  readonly label: string;
  readonly usage: CapUsage;
  readonly showUpgradeHint: boolean;
};

export function isAtLimit(usage: CapUsage): boolean {
  return usage.limit !== null && usage.used >= usage.limit;
}

export function CapCounter(props: CapCounterProps): ReactNode {
  const t = useTranslation();
  const appLocale = useLocale().locale();
  const { capKey, label, usage, showUpgradeHint } = props;
  const { limit } = usage;
  const atLimit = isAtLimit(usage);
  return (
    <div data-testid={`cap-counter-${capKey}`}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          data-testid={`cap-counter-${capKey}-value`}
          className="font-medium tabular-nums text-foreground"
        >
          {limit === null ? (
            <>
              {usage.used.toLocaleString(appLocale)}{" "}
              <span className="text-muted-foreground">{t("showpony:caps.unlimited")}</span>
            </>
          ) : (
            `${usage.used.toLocaleString(appLocale)}/${limit.toLocaleString(appLocale)}`
          )}
        </span>
      </div>
      {limit !== null && (
        <ProgressBar
          value={usage.used / limit}
          tone={atLimit ? "warn" : "default"}
          className="mt-1.5"
          testId={`cap-counter-${capKey}-bar`}
        />
      )}
      {atLimit && showUpgradeHint && (
        <div
          data-testid={`cap-counter-${capKey}-upgrade`}
          className="mt-1 text-xs text-muted-foreground"
        >
          {t("showpony:caps.upgradeHint")}
        </div>
      )}
    </div>
  );
}
