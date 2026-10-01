import { tierAssignmentEntity } from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import { buildEntityTable, type TenantDb } from "@cosmicdrift/kumiko-framework/db";
import {
  capsForTier,
  DEFAULT_TIER,
  isTierName,
  type ShowPonyCaps,
  type TierName,
} from "./tier-map";

export const tierAssignmentTable = buildEntityTable("tier-assignment", tierAssignmentEntity);

export async function resolveTier(db: TenantDb): Promise<TierName> {
  const row = await db.fetchOne<{ tier?: unknown }>(tierAssignmentTable, { tenantId: db.tenantId });
  const tier = row?.tier;
  return typeof tier === "string" && isTierName(tier) ? tier : DEFAULT_TIER;
}

export async function resolveTierCaps(db: TenantDb): Promise<ShowPonyCaps> {
  return capsForTier(await resolveTier(db));
}
