import {
  type BillingPlansResult,
  SubscriptionFoundationQueries,
} from "@cosmicdrift/kumiko-bundled-features/billing-foundation/web";
import { CapOverviewContracts } from "@cosmicdrift/kumiko-bundled-features/cap-overview/constants";
import { type ExtensionSectionProps, useQuery, useTranslation } from "@cosmicdrift/kumiko-renderer";
import type { ReactNode } from "react";
import { isAtLimit, isUpgradeOffered } from "./billing-upgrade-hint";

export function ShowPonyUpgradeHint(_props: ExtensionSectionProps): ReactNode {
  const t = useTranslation();
  const usageQuery = useQuery(CapOverviewContracts.capsUsage, {});
  const billingPlansQuery = useQuery<BillingPlansResult>(
    SubscriptionFoundationQueries.billingPlans,
    {},
  );

  // Fail-closed: a loading/failed query never shows a hint the plan catalog
  // itself hasn't confirmed is available.
  if (usageQuery.error !== null || billingPlansQuery.error !== null) return null;
  const rows = usageQuery.data?.rows ?? [];
  if (!rows.some(isAtLimit) || !isUpgradeOffered(billingPlansQuery.data ?? null)) return null;

  return (
    <div className="text-sm text-muted-foreground">
      {t("showpony:caps.upgradeHint")}
    </div>
  );
}
