import { useTranslation } from "@cosmicdrift/kumiko-renderer";
import type { ReactNode } from "react";
import type { CapUsage } from "../handlers/usage.query";

export type CapCounterProps = {
  readonly capKey: string;
  readonly label: string;
  readonly usage: CapUsage;
};

export function isAtLimit(usage: CapUsage): boolean {
  return usage.limit !== null && usage.used >= usage.limit;
}

export function CapCounter(props: CapCounterProps): ReactNode {
  const t = useTranslation();
  const { capKey, label, usage } = props;
  const unlimited = usage.limit === null;
  const atLimit = isAtLimit(usage);
  return (
    <div
      data-testid={`cap-counter-${capKey}`}
      className="flex items-baseline justify-between gap-3 text-sm"
    >
      <span className="text-muted-foreground">{label}</span>
      <span
        data-testid={`cap-counter-${capKey}-value`}
        className={`font-mono ${atLimit ? "font-medium text-destructive" : ""}`}
      >
        {unlimited ? (
          <>
            {usage.used.toLocaleString()}{" "}
            <span className="text-muted-foreground">{t("showpony:caps.unlimited")}</span>
          </>
        ) : (
          `${usage.used}/${usage.limit}`
        )}
        {atLimit && (
          <span data-testid={`cap-counter-${capKey}-upgrade`} className="ml-1 font-normal">
            · {t("showpony:caps.upgradeHint")}
          </span>
        )}
      </span>
    </div>
  );
}
