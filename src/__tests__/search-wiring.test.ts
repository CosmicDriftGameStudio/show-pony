import { describe, expect, test } from "bun:test";
import { resolveSearchAdapter } from "../../bin/search-wiring";

describe("resolveSearchAdapter", () => {
  test("both env vars unset → in-memory adapter that actually indexes and finds documents", async () => {
    const { adapter } = resolveSearchAdapter({});
    await adapter.index("tenant-a" as never, {
      entityType: "rsvp",
      entityId: "rsvp-1" as never,
      weight: 1,
      fields: { name: "Ada Lovelace" },
    });
    const results = await adapter.search("tenant-a" as never, "Lovelace");
    expect(results).toEqual([{ entityType: "rsvp", entityId: "rsvp-1" }]);
  });

  test("both env vars set → a real Meilisearch adapter, not the in-memory fallback", async () => {
    const { adapter } = resolveSearchAdapter({
      MEILI_URL: "http://127.0.0.1:1",
      MEILI_MASTER_KEY: "k",
    });
    await expect(
      adapter.index("tenant-a" as never, {
        entityType: "rsvp",
        entityId: "rsvp-1" as never,
        weight: 1,
        fields: { name: "Ada" },
      }),
    ).rejects.toThrow();
  });

  test("blank env vars (whitespace-only) → in-memory adapter that actually indexes and finds documents", async () => {
    const { adapter } = resolveSearchAdapter({ MEILI_URL: "   ", MEILI_MASTER_KEY: "   " });
    await adapter.index("tenant-a" as never, {
      entityType: "rsvp",
      entityId: "rsvp-1" as never,
      weight: 1,
      fields: { name: "Ada Lovelace" },
    });
    const results = await adapter.search("tenant-a" as never, "Lovelace");
    expect(results).toEqual([{ entityType: "rsvp", entityId: "rsvp-1" }]);
  });

  test("only MEILI_URL set → throws naming both env vars", () => {
    expect(() => resolveSearchAdapter({ MEILI_URL: "http://x" })).toThrow(/MEILI_URL/);
    expect(() => resolveSearchAdapter({ MEILI_URL: "http://x" })).toThrow(/MEILI_MASTER_KEY/);
  });

  test("only MEILI_MASTER_KEY set → throws naming both env vars", () => {
    expect(() => resolveSearchAdapter({ MEILI_MASTER_KEY: "k" })).toThrow(/MEILI_URL/);
    expect(() => resolveSearchAdapter({ MEILI_MASTER_KEY: "k" })).toThrow(/MEILI_MASTER_KEY/);
  });
});
