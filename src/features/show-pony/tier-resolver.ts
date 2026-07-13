import { tierAssignmentEntity } from "@cosmicdrift/kumiko-bundled-features/tier-engine";
import { buildEntityTable, type DbConnection, fetchOne } from "@cosmicdrift/kumiko-framework/db";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import {
  capsForTier,
  DEFAULT_TIER,
  isTierName,
  type ShowPonyCaps,
  type TierName,
} from "./tier-map";

export const tierAssignmentTable = buildEntityTable("tier-assignment", tierAssignmentEntity);

export async function resolveTier(db: DbConnection, tenantId: TenantId): Promise<TierName> {
  const row = await fetchOne<{ tier?: unknown }>(db, tierAssignmentTable, { tenantId });
  const tier = row?.tier;
  return typeof tier === "string" && isTierName(tier) ? tier : DEFAULT_TIER;
}

export async function resolveTierCaps(
  db: DbConnection,
  tenantId: TenantId,
): Promise<ShowPonyCaps> {
  return capsForTier(await resolveTier(db, tenantId));
}
