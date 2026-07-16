// The demo seed runs at boot (seedsDir). A write that throws there aborts the
// whole boot — that's exactly what crash-looped prod deploys.
//
// systemWriteAs THROWS on a failed write — mocks must throw to match prod.

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import seed from "../../seeds/2026-06-28-demo-event-rsvps";

type SeedCtx = Parameters<typeof seed.run>[0];

const SEED_PATH = join(import.meta.dirname, "../../seeds/2026-06-28-demo-event-rsvps.ts");

function emptyDb(): SeedCtx["db"] {
  return {
    unsafe: async () => [],
  } as unknown as SeedCtx["db"];
}

describe("demo seed boot-safety", () => {
  test("seed file never imports ../src (Docker runtime has no src/)", () => {
    const source = readFileSync(SEED_PATH, "utf8");
    expect(source).not.toMatch(/from\s+["']\.\.\/src\//);
  });

  test("seed file has no runtime @cosmicdrift imports (dist-server omits npm deps)", () => {
    const source = readFileSync(SEED_PATH, "utf8");
    const runtimeImports = source.match(/^import\s+(?!type\b)[^;]+from\s+["']@cosmicdrift\//gm);
    expect(runtimeImports).toBeNull();
  });

  test("_demo-event-db.ts's hardcoded table literal matches the real event table (drift pin)", async () => {
    const { eventTable } = await import("../features/show-pony/schema/event");
    const source = readFileSync(join(import.meta.dirname, "../../seeds/_demo-event-db.ts"), "utf8");
    expect(source).toContain(`FROM ${eventTable.tableName}`);
  });

  test("DEMO_TENANT_ID / ACME_TENANT_ID literals match bin/demo-tenants.ts (drift pin)", async () => {
    const { DEMO_TENANT, ACME_TENANT } = await import("../../bin/demo-tenants");
    const source = readFileSync(join(import.meta.dirname, "../../seeds/_demo-event-db.ts"), "utf8");
    expect(source).toContain(`DEMO_TENANT_ID = "${DEMO_TENANT.id}"`);
    expect(source).toContain(`ACME_TENANT_ID = "${ACME_TENANT.id}"`);
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
        return { isSuccess: true as const };
      },
    } as unknown as SeedCtx;

    await expect(seed.run(ctx)).resolves.toBeUndefined();
    expect(calls.filter((c) => c === "showpony:write:event:create")).toHaveLength(3);
    expect(calls.filter((c) => c === "showpony:write:rsvp:submit")).toHaveLength(4);
  });
});
