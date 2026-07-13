// The demo seed runs at boot (seedsDir). A write that throws there aborts the
// whole boot — that's exactly what crash-looped the first prod deploy:
// systemWriteAs("rsvp:submit") threw because the es-ops seed dispatcher has no
// RateLimitResolver in prod. These tests pin the boot-safety so a future edit
// can't silently re-introduce a boot-crashing seed.
//
// systemWriteAs THROWS on a failed write (it doesn't return a failure result),
// so the mock throws to model the real framework behaviour.

import { describe, expect, test } from "bun:test";
import seed from "../../seeds/2026-06-28-demo-event-rsvps";

type SeedCtx = Parameters<typeof seed.run>[0];

function emptyDb(): SeedCtx["db"] {
  return {
    unsafe: async () => [],
  } as unknown as SeedCtx["db"];
}

describe("demo seed boot-safety", () => {
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
    // Rooftop seeded (critical), Warmup attempted (best-effort), plus one Acme seed event.
    expect(calls.filter((c) => c === "showpony:write:event:create")).toHaveLength(3);
    expect(calls.filter((c) => c === "showpony:write:rsvp:submit")).toHaveLength(4);
  });

  test("patches rooftop description when slug already exists (idempotent retry)", async () => {
    const calls: string[] = [];
    const ctx = {
      db: {
        unsafe: async (_sql: string, params?: readonly unknown[]) => {
          const slug = params?.[1];
          const tenantId = params?.[0];
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
    expect(calls.filter((c) => c === "showpony:write:event:update")).toHaveLength(1);
    expect(calls.filter((c) => c === "showpony:write:rsvp:submit")).toHaveLength(4);
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
    // Rooftop created; warmup attempted but caught; Acme event attempted; guests attempted.
    expect(calls.filter((c) => c === "showpony:write:event:create")).toHaveLength(3);
    expect(calls.filter((c) => c === "showpony:write:rsvp:submit")).toHaveLength(4);
  });
});


