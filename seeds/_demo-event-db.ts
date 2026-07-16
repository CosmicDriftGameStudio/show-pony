// Shared read helpers for demo-event seeds. Underscore prefix → ignored by es-ops runner.
//
// RUNTIME: seeds/ is copied into the Docker image WITHOUT src/ and WITHOUT
// @cosmicdrift/* in node_modules — only type-only framework imports + inline
// QNs, so this can't import `eventTable`/`fetchOne` to derive the table name
// or use bound params. The "read_events" literal below MUST match the real
// entity table name — pinned against drift in
// src/__tests__/seed-boot-safety.test.ts.

import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";

export const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1" as TenantId;
export const ACME_TENANT_ID = "00000000-0000-4000-8000-0000000000a2" as TenantId;

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

// UUID-shaped values only (TenantId literals + hardcoded slugs from this
// file, never user input) — inlined instead of $1/$2 bound params, which
// returned empty rows against the prod raw runner (see the deleted seed
// 2026-07-12-rooftop-desc-fetchone.ts this replaced).
function assertSqlSafe(value: string, label: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error(`demo-event-db: unsafe ${label} value: ${JSON.stringify(value)}`);
  }
}

export async function findEventBySlug(
  raw: RawSqlRunner,
  tenantId: TenantId,
  slug: string,
): Promise<EventRow | null> {
  assertSqlSafe(tenantId, "tenantId");
  assertSqlSafe(slug, "slug");
  const result = await raw.unsafe(
    `SELECT id, version FROM read_events
     WHERE tenant_id = '${tenantId}' AND slug = '${slug}'
     ORDER BY id LIMIT 1`,
  );
  const rows = asEventRows(result);
  return rows[0] ?? null;
}
