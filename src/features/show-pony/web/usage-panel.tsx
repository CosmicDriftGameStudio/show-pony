import {
  type BillingPlansResult,
  SubscriptionFoundationQueries,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation/web";
import { type ExtensionSectionProps, useQuery, useTranslation } from "@cosmicdrift/kumiko-renderer";
import { ErrorState, LoadingState, SectionCard } from "@cosmicdrift/kumiko-renderer-web";
import type { ReactNode } from "react";
import type { UsageInfo } from "../handlers/usage.query";
import { isUpgradeOffered } from "./billing-upgrade-hint";
import { CapCounter } from "./cap-counter";

export function ShowPonyUsagePanel(_props: ExtensionSectionProps): ReactNode {
  const t = useTranslation();
  const query = useQuery<UsageInfo>("showpony:query:usage", {});
  const billingPlansQuery = useQuery<BillingPlansResult>(
    SubscriptionFoundationQueries.billingPlans,
    {},
  );

  if (query.error !== null) {
    return <ErrorState error={query.error} testId="showpony-usage-panel-error" />;
  }
  if (query.loading && !query.data) {
    return <LoadingState testId="showpony-usage-panel-loading" />;
  }
  if (!query.data) return null;
  const usage = query.data;
  // Fail-closed: a loading/failed billing-plans query never shows an upgrade
  // hint the plan catalog itself hasn't confirmed is available.
  const showUpgradeHint =
    billingPlansQuery.error === null && isUpgradeOffered(billingPlansQuery.data ?? null);

  return (
    <SectionCard title={t("showpony:caps.usageTitle")} testId="showpony-usage-panel">
      <div className="space-y-4">
        <CapCounter
          capKey="events"
          label={t("showpony:caps.events")}
          usage={usage.events}
          showUpgradeHint={showUpgradeHint}
        />
        <CapCounter
          capKey="guests"
          label={t("showpony:caps.guests")}
          usage={usage.guests}
          showUpgradeHint={showUpgradeHint}
        />
      </div>
    </SectionCard>
  );
}
