import { enforceStockCap } from "@cosmicdrift/kumiko-bundled-features/cap-counter";
import { countWhere, type DbConnection, type WhereObject } from "@cosmicdrift/kumiko-framework/db";
import type { TenantId, WriteHandlerDef } from "@cosmicdrift/kumiko-framework/engine";
import {
  UnprocessableError,
  type WriteFailure,
  writeFailure,
} from "@cosmicdrift/kumiko-framework/errors";
import type { ShowPonyCaps } from "./tier-map";
import { resolveTierCaps } from "./tier-resolver";

export type StockCapSpec = {
  readonly table: Parameters<typeof countWhere>[1];
  readonly limit: (caps: ShowPonyCaps) => number;
  readonly where?: WhereObject;
  readonly code: string;
  readonly i18nKey: string;
  readonly field: string;
};

export async function checkStockCap(
  db: DbConnection,
  tenantId: TenantId,
  spec: StockCapSpec,
): Promise<WriteFailure | null> {
  const caps = await resolveTierCaps(db, tenantId);
  const current = await countWhere(db, spec.table, { tenantId, ...spec.where });
  const { state, limit } = enforceStockCap({
    current,
    limit: spec.limit(caps),
    profile: "hardSlot",
  });
  if (state !== "exceeded") return null;
  return writeFailure(
    new UnprocessableError(spec.code, {
      i18nKey: spec.i18nKey,
      details: { field: spec.field, reason: spec.code, current, limit },
    }),
  );
}

export function withStockCap(handler: WriteHandlerDef, spec: StockCapSpec): WriteHandlerDef {
  return {
    ...handler,
    handler: async (event, ctx) => {
      const failure = await checkStockCap(ctx.db.raw, event.user.tenantId, spec);
      return failure ?? handler.handler(event, ctx);
    },
  };
}
