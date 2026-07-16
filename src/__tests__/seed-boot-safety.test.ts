// The demo seed runs at boot (seedsDir). A write that throws there aborts the
// whole boot — that's exactly what crash-looped prod deploys.
//
// systemWriteAs THROWS on a failed write — mocks must throw to match prod.

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import seed from "../../seeds/2026-06-28-demo-event-rsvps";

type SeedCtx = Parameters<typeof seed.run>[0];

const SEED_PATH = join(import.meta.dirname, "../../seeds/2026-06-28-demo-event-rsvps.ts");

function emptyDb(): SeedCtx["db"] {
  return {
    unsafe: async () => [],
  } as unknown as SeedCtx["db"];
}

// Guard scope: the runtime constraint (seeds/ ships without src/ and without
// @cosmicdrift/* in node_modules) applies transitively — a banned import
// hiding in a local sibling (e.g. ./_demo-event-db) would boot-crash exactly
// like one in the seed file itself, so the source scan follows local
// relative imports, not just the entry file.
function collectSeedSourceTransitively(entryPath: string, seen: Set<string> = new Set()): string {
  if (seen.has(entryPath)) return "";
  seen.add(entryPath);
  const source = readFileSync(entryPath, "utf8");
  const dir = dirname(entryPath);
  const localSpecifiers = [...source.matchAll(/from\s+["'](\.\.?\/[^"']+)["']/g)].map((m) => m[1]);
  let combined = source;
  for (const specifier of localSpecifiers) {
    for (const candidate of [`${specifier}.ts`, `${specifier}.tsx`, `${specifier}/index.ts`]) {
      const resolved = join(dir, candidate);
      if (existsSync(resolved)) {
        combined += `\n${collectSeedSourceTransitively(resolved, seen)}`;
        break;
      }
    }
  }
  return combined;
}

describe("demo seed boot-safety", () => {
  test("seed file never imports ../src, incl. transitively via local siblings (Docker runtime has no src/)", () => {
    const source = collectSeedSourceTransitively(SEED_PATH);
    expect(source).not.toMatch(/(?:from\s+|import\(\s*|require\(\s*)["']\.\.\/src(?:\/|["'])/);
  });

  test("seed file has no runtime @cosmicdrift imports, incl. transitively (dist-server omits npm deps)", () => {
    const source = collectSeedSourceTransitively(SEED_PATH);
    const runtimeImports = source.match(
      /(?:^import\s+(?!type\b)[^;]+from\s+["']@cosmicdrift\/|import\(\s*["']@cosmicdrift\/|require\(\s*["']@cosmicdrift\/)/gm,
    );
    expect(runtimeImports).toBeNull();
  });

  test("_demo-event-db.ts's hardcoded table literal matches the real event table (drift pin)", async () => {
    const { eventTable } = await import("../features/show-pony/schema/event");
    const source = readFileSync(join(import.meta.dirname, "../../seeds/_demo-event-db.ts"), "utf8");
    expect(source).toContain(`FROM ${eventTable.tableName}`);
  });

  test("findEventBySlug rejects quote/injection-shaped slug or tenantId instead of interpolating them", async () => {
    const { findEventBySlug } = await import("../../seeds/_demo-event-db");
    const raw = { unsafe: async () => [] };
    await expect(findEventBySlug(raw, "tenant" as never, "x' OR '1'='1")).rejects.toThrow(
      /unsafe slug value/,
    );
    await expect(findEventBySlug(raw, "' OR '1'='1" as never, "rooftop-launch")).rejects.toThrow(
      /unsafe tenantId value/,
    );
  });

  test("DEMO_TENANT_ID / ACME_TENANT_ID literals match bin/demo-tenants.ts (drift pin)", async () => {
    const { DEMO_TENANT, ACME_TENANT } = await import("../../bin/demo-tenants");
    const source = readFileSync(join(import.meta.dirname, "../../seeds/_demo-event-db.ts"), "utf8");
    expect(source).toContain(`DEMO_TENANT_ID = "${DEMO_TENANT.id}"`);
    expect(source).toContain(`ACME_TENANT_ID = "${ACME_TENANT.id}"`);
  });

  test("inline QN literals for invite/branding config match the real constants (drift pin)", async () => {
    const { INVITE_BRANDING_QN } = await import("../features/show-pony/invite-branding.shared");
    const { BRANDING_QN } = await import("@cosmicdrift/kumiko-bundled-features/managed-pages");
    const source = readFileSync(
      join(import.meta.dirname, "../../seeds/2026-06-28-demo-event-rsvps.ts"),
      "utf8",
    );
    expect(source).toContain(`INVITE_HERO_IMAGE_URL = "${INVITE_BRANDING_QN.heroImageUrl}"`);
    expect(source).toContain(`INVITE_HERO_STYLE = "${INVITE_BRANDING_QN.heroStyle}"`);
    expect(source).toContain(`BRANDING_TITLE = "${BRANDING_QN.title}"`);
    expect(source).toContain(`BRANDING_DESCRIPTION = "${BRANDING_QN.description}"`);
    expect(source).toContain(`BRANDING_ACCENT_COLOR = "${BRANDING_QN.accentColor}"`);
  });

  test("rsvp:submit failures do NOT crash the seed — best-effort guests", async () => {
    const calls: string[] = [];
    const ctx = {
      db: emptyDb(),
      systemWriteAs: async (handler: string) => {
        calls.push(handler);
        if (handler === "showpony:write:rsvp:submit") {
          throw new Error("Handler declares rateLimit but no RateLimitResolver is configured");
        }
        return { isSuccess: true, data: { id: "evt" } };
      },
    } as unknown as SeedCtx;

    await expect(seed.run(ctx)).resolves.toBeUndefined();
    expect(calls.filter((c) => c === "showpony:write:event:create")).toHaveLength(3);
    expect(calls.filter((c) => c === "showpony:write:rsvp:submit")).toHaveLength(4);
  });

  test("patches rooftop description when slug already exists (idempotent retry)", async () => {
    const calls: string[] = [];
    const ctx = {
      db: {
        unsafe: async (sql: string) => {
          const slug = /slug = '([^']+)'/.exec(sql)?.[1];
          const tenantId = /tenant_id = '([^']+)'/.exec(sql)?.[1];
          if (slug === "rooftop-launch") {
            return [{ id: "existing-rooftop", version: 1 }];
          }
          if (slug === "warmup-drinks") {
            return [{ id: "existing-warmup", version: 1 }];
          }
          if (slug === "acme-offsite" && tenantId) {
            return [{ id: "existing-acme", version: 1 }];
          }
          return [];
        },
      },
      systemWriteAs: async (handler: string) => {
        calls.push(handler);
        return { isSuccess: true, data: { id: "evt" } };
      },
    } as unknown as SeedCtx;

    await expect(seed.run(ctx)).resolves.toBeUndefined();
    expect(calls.filter((c) => c === "showpony:write:event:create")).toHaveLength(0);
    expect(calls.filter((c) => c === "showpony:write:event:update")).toHaveLength(2);
    expect(calls.filter((c) => c === "showpony:write:rsvp:submit")).toHaveLength(4);
  });

  test("event:update and branding failures do NOT crash — best-effort patch", async () => {
    const calls: string[] = [];
    const ctx = {
      db: {
        unsafe: async (sql: string) => {
          const slug = /slug = '([^']+)'/.exec(sql)?.[1];
          if (slug === "rooftop-launch") return [{ id: "existing-rooftop", version: 1 }];
          if (slug === "warmup-drinks") return [{ id: "existing-warmup", version: 1 }];
          if (slug === "acme-offsite") return [{ id: "existing-acme", version: 1 }];
          return [];
        },
      },
      systemWriteAs: async (handler: string) => {
        calls.push(handler);
        if (handler === "showpony:write:event:update") {
          throw new Error("stale_state");
        }
        if (handler === "config:write:set") {
          throw new Error("config boom");
        }
        return { isSuccess: true, data: { id: "evt" } };
      },
    } as unknown as SeedCtx;

    await expect(seed.run(ctx)).resolves.toBeUndefined();
    // Best-effort: both stale event:update attempts AND all 10 branding
    // config:write:set calls (5 keys × 2 tenants) happen despite every one
    // throwing — a no-op regression (nothing attempted) would resolve too,
    // but wouldn't produce these counts.
    expect(calls.filter((c) => c === "showpony:write:event:update")).toHaveLength(2);
    expect(calls.filter((c) => c === "config:write:set")).toHaveLength(10);
  });

  test("a Rooftop event:create failure DOES crash the seed — Rooftop is critical", async () => {
    const ctx = {
      db: emptyDb(),
      systemWriteAs: async (handler: string, payload: unknown) => {
        if (
          handler === "showpony:write:event:create" &&
          (payload as { slug?: string }).slug === "rooftop-launch"
        ) {
          throw new Error("rooftop boom");
        }
        return { isSuccess: true as const };
      },
    } as unknown as SeedCtx;

    await expect(seed.run(ctx)).rejects.toThrow("rooftop boom");
  });

  test("a Winter Warmup event:create failure does NOT crash — best-effort", async () => {
    const calls: string[] = [];
    const ctx = {
      db: emptyDb(),
      systemWriteAs: async (handler: string, payload: unknown) => {
        calls.push(handler);
        if (
          handler === "showpony:write:event:create" &&
          (payload as { slug?: string }).slug === "warmup-drinks"
        ) {
          throw new Error("warmup cap exceeded");
        }
        return { isSuccess: true as const, data: { id: "evt" } };
      },
    } as unknown as SeedCtx;

    await expect(seed.run(ctx)).resolves.toBeUndefined();
    expect(calls.filter((c) => c === "showpony:write:event:create")).toHaveLength(3);
    expect(calls.filter((c) => c === "showpony:write:rsvp:submit")).toHaveLength(4);
  });

  test("event:create payload never includes an id (regression pin for the duplicate-events incident)", async () => {
    const payloads: Array<{ handler: string; payload: unknown }> = [];
    const ctx = {
      db: emptyDb(),
      systemWriteAs: async (handler: string, payload: unknown) => {
        payloads.push({ handler, payload });
        return { isSuccess: true as const, data: { id: "evt" } };
      },
    } as unknown as SeedCtx;

    await expect(seed.run(ctx)).resolves.toBeUndefined();

    const creates = payloads.filter((p) => p.handler === "showpony:write:event:create");
    expect(creates).toHaveLength(3);
    for (const { payload } of creates) {
      expect(payload).not.toHaveProperty("id");
    }
  });

  test("rsvp eventId comes from the create response, not a re-query (regression pin for the phantom-fallback incident)", async () => {
    const payloads: Array<{ handler: string; payload: unknown }> = [];
    const ctx = {
      // findEventBySlug always misses — simulates read-model lag right after create.
      db: emptyDb(),
      systemWriteAs: async (handler: string, payload: unknown) => {
        payloads.push({ handler, payload });
        if (handler === "showpony:write:event:create") {
          const slug = (payload as { slug?: string }).slug;
          return { isSuccess: true as const, data: { id: `created-${slug}` } };
        }
        return { isSuccess: true as const, data: { id: "evt" } };
      },
    } as unknown as SeedCtx;

    await expect(seed.run(ctx)).resolves.toBeUndefined();

    const rsvps = payloads.filter((p) => p.handler === "showpony:write:rsvp:submit");
    expect(rsvps).toHaveLength(4);
    for (const { payload } of rsvps) {
      expect((payload as { eventId: string }).eventId).toBe("created-rooftop-launch");
    }
  });
});
