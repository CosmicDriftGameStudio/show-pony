import {
  useDispatcher,
  useLocale,
  usePrimitives,
  useQuery,
  useTranslation,
} from "@cosmicdrift/kumiko-renderer";
import { FormScreenShell } from "@cosmicdrift/kumiko-renderer-web";
import { type ReactNode, useState } from "react";
import {
  BILLING_TIER_MONTHLY_EUR,
  PAID_TIERS,
  type PaidTier,
  tierBenefits,
  tierDisplayName,
} from "../billing/pricing";
import type { BillingInfo } from "../handlers/billing-info.query";
import type { UsageInfo } from "../handlers/usage.query";
import { CapCounter } from "./cap-counter";

export type BillingViewProps = {
  readonly data: BillingInfo;
  readonly usage: UsageInfo | null;
  readonly redirecting: boolean;
  readonly formError: string | null;
  readonly onUpgrade: (priceId: string) => void;
  readonly onPortal: () => void;
};

function UsageOverview(props: { readonly usage: UsageInfo }): ReactNode {
  const t = useTranslation();
  const { Card } = usePrimitives();
  const { usage } = props;
  return (
    <Card testId="billing-usage" className="mt-4" slots={{ title: t("showpony:caps.usageTitle") }}>
      <div className="space-y-1">
        <CapCounter capKey="events" label={t("showpony:caps.events")} usage={usage.events} />
        <CapCounter capKey="guests" label={t("showpony:caps.guests")} usage={usage.guests} />
      </div>
    </Card>
  );
}

function PricingBox(props: {
  readonly tier: PaidTier;
  readonly priceId: string;
  readonly isCurrent: boolean;
  readonly redirecting: boolean;
  readonly hasSubscription: boolean;
  readonly onUpgrade: (priceId: string) => void;
  readonly onPortal: () => void;
}): ReactNode {
  const t = useTranslation();
  const { Card, Button } = usePrimitives();
  const appLocale = useLocale().locale();
  const { tier, priceId, isCurrent, redirecting, hasSubscription, onUpgrade, onPortal } = props;
  const footer = isCurrent ? (
    <div className="flex w-full flex-col gap-2">
      <span
        data-testid="billing-current-badge"
        className="w-full rounded bg-primary/10 px-4 py-2 text-center text-sm font-medium text-primary"
      >
        ✓ {t("showpony:billing.currentTier")}
      </span>
      {hasSubscription && (
        <Button
          variant="secondary"
          width="full"
          disabled={redirecting}
          onClick={() => onPortal()}
          testId="billing-portal"
        >
          {t("showpony:billing.managePortal")}
        </Button>
      )}
    </div>
  ) : (
    <Button
      width="full"
      disabled={redirecting}
      onClick={() => (hasSubscription ? onPortal() : onUpgrade(priceId))}
      testId={`billing-upgrade-${tier}`}
    >
      {hasSubscription ? t("showpony:billing.switchInPortal") : t("showpony:billing.upgradeTo")}{" "}
      {tierDisplayName(tier)}
    </Button>
  );
  return (
    <Card
      testId={`billing-plan-${tier}`}
      className={isCurrent ? "border-primary" : undefined}
      slots={{ footer }}
    >
      <h2 className="text-lg font-semibold">{tierDisplayName(tier)}</h2>
      <div className="mt-1 mb-3">
        <span className="text-2xl font-bold">{BILLING_TIER_MONTHLY_EUR[tier]}</span>{" "}
        <span className="text-sm text-muted-foreground">{t("showpony:billing.perMonth")}</span>
      </div>
      <ul className="space-y-1 text-sm">
        {tierBenefits(tier).map((benefit) => (
          <li key={benefit.labelKey} className="flex gap-2">
            <span aria-hidden="true">✓</span>
            <span>
              {benefit.count !== undefined && (
                <>
                  {benefit.count === "unlimited"
                    ? t("showpony:billing.unlimited")
                    : benefit.count.toLocaleString(appLocale)}{" "}
                </>
              )}
              {t(benefit.labelKey)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const TERMINAL_SUBSCRIPTION_STATUSES = ["canceled", "incomplete_expired"];

export function hasManageableSubscriptionState(subscription: BillingInfo["subscription"]): boolean {
  return subscription !== null && !TERMINAL_SUBSCRIPTION_STATUSES.includes(subscription.status);
}

// The status pill only shows for a subscription that's either the tier the
// tenant is currently on, or in a non-"active" state worth surfacing (e.g.
// "past_due" while browsing a different tier). Returns the i18n status key
// to render, or null to hide the pill.
export function subscriptionStatusKey(
  subscription: BillingInfo["subscription"],
  currentTier: BillingInfo["tier"],
): string | null {
  if (!subscription) return null;
  if (subscription.tier !== currentTier && subscription.status === "active") return null;
  return subscription.status;
}

export function BillingView(props: BillingViewProps): ReactNode {
  const t = useTranslation();
  const { Card } = usePrimitives();
  const { data, usage, redirecting, formError, onUpgrade, onPortal } = props;

  const statusKey = subscriptionStatusKey(data.subscription, data.tier);
  const statusLabel = statusKey ? t(`showpony:billing.status.${statusKey}`) : null;

  const hasManageableSubscription = hasManageableSubscriptionState(data.subscription);

  return (
    <FormScreenShell testId="billing">
      <h1 className="text-xl font-semibold mb-4" data-testid="billing-title">
        {t("showpony:billing.title")}
      </h1>

      <Card testId="billing-current">
        <div className="text-sm text-muted-foreground">{t("showpony:billing.currentTier")}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-semibold" data-testid="billing-current-tier">
            {tierDisplayName(data.tier)}
          </span>
          {statusLabel && (
            <span className="text-xs text-muted-foreground" data-testid="billing-status">
              ({statusLabel})
            </span>
          )}
        </div>
      </Card>

      {usage && <UsageOverview usage={usage} />}

      {!data.enabled && (
        <p className="mt-4 text-sm text-muted-foreground" data-testid="billing-not-configured">
          {t("showpony:billing.notConfigured")}
        </p>
      )}

      {data.enabled && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2" data-testid="billing-upgrades">
          {PAID_TIERS.map((tier) => {
            const priceId = data.prices[tier];
            if (!priceId) return null;
            return (
              <PricingBox
                key={tier}
                tier={tier}
                priceId={priceId}
                isCurrent={tier === data.tier}
                redirecting={redirecting}
                hasSubscription={hasManageableSubscription}
                onUpgrade={onUpgrade}
                onPortal={onPortal}
              />
            );
          })}
        </div>
      )}

      {data.enabled && data.subscription && (
        <p className="mt-4 text-xs text-muted-foreground" data-testid="billing-portal-hint">
          {t("showpony:billing.portalHint")}
        </p>
      )}

      {redirecting && (
        <p className="mt-3 text-sm text-muted-foreground" data-testid="billing-redirecting">
          {t("showpony:billing.redirecting")}
        </p>
      )}
      {formError && (
        <div
          className="mt-3 rounded border border-destructive bg-destructive/10 p-2 text-sm text-destructive"
          data-testid="billing-error"
        >
          {formError}
        </div>
      )}
    </FormScreenShell>
  );
}

export function BillingScreen(): ReactNode {
  const t = useTranslation();
  const dispatcher = useDispatcher();
  const { data, error, loading } = useQuery<BillingInfo>("showpony:query:billing-info", {});
  const { data: usage } = useQuery<UsageInfo>("showpony:query:usage", {});

  const [redirecting, setRedirecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (loading) return <div className="p-4 text-sm text-muted-foreground">…</div>;
  if (error) return <div className="p-4 text-sm text-destructive">{String(error)}</div>;
  if (!data) return null;

  async function onUpgrade(priceId: string): Promise<void> {
    setRedirecting(true);
    setFormError(null);
    const result = await dispatcher.write<{ url: string }>(
      "billing-foundation:write:create-checkout-session",
      {
        providerName: "stripe",
        priceId,
        successUrl: window.location.href,
        cancelUrl: window.location.href,
      },
    );
    if (!result.isSuccess) {
      setFormError(result.error?.message ?? t("showpony:billing.error"));
      setRedirecting(false);
      return;
    }
    window.location.assign(result.data.url);
  }

  async function onPortal(): Promise<void> {
    setRedirecting(true);
    setFormError(null);
    const result = await dispatcher.write<{ url: string }>(
      "billing-foundation:write:create-portal-session",
      { returnUrl: window.location.href },
    );
    if (!result.isSuccess) {
      setFormError(result.error?.message ?? t("showpony:billing.error"));
      setRedirecting(false);
      return;
    }
    window.location.assign(result.data.url);
  }

  return (
    <BillingView
      data={data}
      usage={usage ?? null}
      redirecting={redirecting}
      formError={formError}
      onUpgrade={(priceId) => void onUpgrade(priceId)}
      onPortal={() => void onPortal()}
    />
  );
}
