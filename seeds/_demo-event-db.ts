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

function hasUnsafe(value: unknown): value is RawSqlRunner {
  return (
    typeof value === "object" &&
    value !== null &&
    "unsafe" in value &&
    typeof value.unsafe === "function"
  );
}

export function toRawSqlRunner(db: unknown): RawSqlRunner {
  if (hasUnsafe(db)) return db;
  const raw = typeof db === "object" && db !== null && "raw" in db ? db.raw : undefined;
  if (hasUnsafe(raw)) return raw;
  throw new Error("demo-event-db: ctx.db exposes no raw .unsafe runner");
}

// Seeds ship without @cosmicdrift/* at runtime, so the shared type guards can't be imported here.
export function idOf(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null || !("id" in data)) return undefined;
  return typeof data.id === "string" ? data.id : undefined;
}

function firstRowOf(result: unknown): unknown {
  if (Array.isArray(result)) return result[0];
  if (typeof result === "object" && result !== null && "rows" in result) {
    return Array.isArray(result.rows) ? result.rows[0] : undefined;
  }
  return undefined;
}

function toEventRow(row: unknown): EventRow | null {
  if (typeof row !== "object" || row === null || !("id" in row) || !("version" in row)) return null;
  if (typeof row.id !== "string") return null;
  return { id: row.id, version: Number(row.version) };
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
  // kumiko-lint-ignore raw-sql seeds ship without @cosmicdrift/* (see header); both values pass assertSqlSafe
  const result = await raw.unsafe(
    `SELECT id, version FROM read_events
     WHERE tenant_id = '${tenantId}' AND slug = '${slug}'
     ORDER BY id LIMIT 1`,
  );
  return toEventRow(firstRowOf(result));
}
