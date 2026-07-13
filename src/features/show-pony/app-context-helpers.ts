import type { TierName } from "./tier-map";

export type BillingPrices = Readonly<Partial<Record<Exclude<TierName, "free" | "studio">, string>>>;
type AppContextWithBillingPrices = { readonly billingPrices?: BillingPrices };

export function getBillingPrices(ctx: unknown): BillingPrices | null {
  if (typeof ctx !== "object" || ctx === null) return null;
  const prices = (ctx as AppContextWithBillingPrices).billingPrices;
  return prices ?? null;
}
