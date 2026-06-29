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

describe("demo seed boot-safety", () => {
  test("rsvp:submit failures do NOT crash the seed — best-effort guests", async () => {
    const calls: string[] = [];
    const ctx = {
      systemWriteAs: async (handler: string) => {
        calls.push(handler);
        if (handler === "showpony:write:rsvp:submit") {
          throw new Error("Handler declares rateLimit but no RateLimitResolver is configured");
        }
        return { isSuccess: true, data: { id: "evt" } };
      },
    } as unknown as SeedCtx;

    await expect(seed.run(ctx)).resolves.toBeUndefined();
    // Event seeded first (critical), then all 4 guest attempts made + caught.
    expect(calls[0]).toBe("showpony:write:event:create");
    expect(calls.filter((c) => c === "showpony:write:rsvp:submit")).toHaveLength(4);
  });

  test("an event:create failure DOES crash the seed — the event is critical", async () => {
    const ctx = {
      systemWriteAs: async (handler: string) => {
        if (handler === "showpony:write:event:create") throw new Error("event boom");
        return { isSuccess: true, data: { id: "evt" } };
      },
    } as unknown as SeedCtx;

    await expect(seed.run(ctx)).rejects.toThrow("event boom");
  });
});
