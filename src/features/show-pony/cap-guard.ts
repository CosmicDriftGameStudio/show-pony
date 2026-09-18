import {
  type StockCapSpec as BundledStockCapSpec,
  createStockCapGuard,
} from "@cosmicdrift/kumiko-bundled-features/cap-counter";
import type { ShowPonyCaps } from "./tier-map";
import { resolveTierCaps } from "./tier-resolver";

export type StockCapSpec = BundledStockCapSpec<ShowPonyCaps>;

export const { checkStockCap, withStockCap } = createStockCapGuard<ShowPonyCaps>((db) =>
  resolveTierCaps(db, db.tenantId),
);
