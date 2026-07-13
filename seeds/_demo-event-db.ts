// Shared read helpers for demo-event seeds. Underscore prefix → ignored by es-ops runner.

import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";

export const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;
export const DEMO_EVENT_ID = "00000000-0000-4000-8000-0000000000e1";

export type EventRow = { id: string; version: number };

type RawSqlRunner = {
  readonly unsafe: (sql: string, params?: readonly unknown[]) => Promise<unknown>;
};

export function toRawSqlRunner(db: unknown): RawSqlRunner {
  const candidate = db as Record<string, unknown>;
  if (typeof candidate["unsafe"] === "function") return db as RawSqlRunner;
  const raw = candidate["raw"] as Record<string, unknown> | undefined;
  if (raw && typeof raw["unsafe"] === "function") return raw as RawSqlRunner;
  throw new Error("demo-event-db: ctx.db exposes no raw .unsafe runner");
}

function asEventRows(result: unknown): EventRow[] {
  if (Array.isArray(result)) return result as EventRow[];
  if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: EventRow[] }).rows;
  }
  return [];
}

export async function findEventBySlug(
  raw: RawSqlRunner,
  slug: string,
): Promise<EventRow | null> {
  const result = await raw.unsafe(
    `SELECT id, version FROM read_events
     WHERE tenant_id = $1 AND slug = $2
     LIMIT 1`,
    [DEMO_TENANT_ID, slug],
  );
  const rows = asEventRows(result);
  return rows[0] ?? null;
}
