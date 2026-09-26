import { type ExtensionSectionProps, useQuery, useTranslation } from "@cosmicdrift/kumiko-renderer";
import { ErrorState, LoadingState, SectionCard } from "@cosmicdrift/kumiko-renderer-web";
import type { ReactNode } from "react";
import type { UsageInfo } from "../handlers/usage.query";
import { CapCounter } from "./cap-counter";

export function ShowPonyUsagePanel(_props: ExtensionSectionProps): ReactNode {
  const t = useTranslation();
  const query = useQuery<UsageInfo>("showpony:query:usage", {});

  if (query.error !== null) {
    return <ErrorState error={query.error} testId="showpony-usage-panel-error" />;
  }
  if (query.loading && !query.data) {
    return <LoadingState testId="showpony-usage-panel-loading" />;
  }
  if (!query.data) return null;
  const usage = query.data;

  return (
    <SectionCard title={t("showpony:caps.usageTitle")} testId="showpony-usage-panel">
      <div className="space-y-1">
        <CapCounter capKey="events" label={t("showpony:caps.events")} usage={usage.events} />
        <CapCounter capKey="guests" label={t("showpony:caps.guests")} usage={usage.guests} />
      </div>
    </SectionCard>
  );
}
