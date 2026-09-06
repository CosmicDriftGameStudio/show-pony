import { describe, expect, test } from "bun:test";
import type { Registry } from "@cosmicdrift/kumiko-framework/engine";
import type { SearchAdapter, SearchAdapterConfig } from "@cosmicdrift/kumiko-framework/search";
import {
  collectSearchableFieldNames,
  configureAllTenantSearchIndexes,
  resolveSearchAdapter,
} from "../../bin/search-wiring";

describe("resolveSearchAdapter", () => {
  test("both env vars unset → in-memory adapter that actually indexes and finds documents", async () => {
    const adapter = resolveSearchAdapter({});
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
    const adapter = resolveSearchAdapter({
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
    const adapter = resolveSearchAdapter({ MEILI_URL: "   ", MEILI_MASTER_KEY: "   " });
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

function fakeRegistry(entities: Record<string, readonly string[]>): Registry {
  return {
    getAllEntities: () => new Map(Object.keys(entities).map((name) => [name, {}])),
    getSearchableFields: (name: string) => entities[name] ?? [],
  } as unknown as Registry;
}

describe("collectSearchableFieldNames", () => {
  test("dedupes the union of searchable fields across all entities", () => {
    const registry = fakeRegistry({
      rsvp: ["name", "email"],
      event: ["title", "name"],
    });
    expect([...collectSearchableFieldNames(registry)].sort()).toEqual(["email", "name", "title"]);
  });
});

describe("configureAllTenantSearchIndexes", () => {
  test("configures every enabled tenant with the searchable-field union, returns the tenant count", async () => {
    const tenantRows = [{ id: "t-1" }, { id: "t-2" }, { id: "t-3" }];
    const fakeDb = { unsafe: async () => tenantRows } as unknown as Parameters<
      typeof configureAllTenantSearchIndexes
    >[0];
    const registry = fakeRegistry({ rsvp: ["name", "email"] });
    const calls: Array<{ tenantId: string; config: SearchAdapterConfig }> = [];
    const fakeAdapter: SearchAdapter = {
      configure: async (tenantId, config) => {
        calls.push({ tenantId: tenantId as unknown as string, config });
      },
      index: async () => undefined,
      search: async () => [],
      remove: async () => undefined,
    };

    const count = await configureAllTenantSearchIndexes(fakeDb, registry, fakeAdapter);

    expect(count).toBe(3);
    expect(calls).toHaveLength(3);
    expect(calls.map((c) => c.tenantId)).toEqual(["t-1", "t-2", "t-3"]);
    for (const call of calls) {
      expect(call.config.searchableFields.slice().sort()).toEqual(["email", "name"]);
      expect(call.config.rankingFields?.slice().sort()).toEqual(["email", "name"]);
    }
  });

  test("rejects with the tenant id when a configure() call hangs", async () => {
    const tenantRows = [{ id: "t-1" }];
    const fakeDb = { unsafe: async () => tenantRows } as unknown as Parameters<
      typeof configureAllTenantSearchIndexes
    >[0];
    const registry = fakeRegistry({ rsvp: ["name"] });
    const hangingAdapter: SearchAdapter = {
      configure: () => new Promise(() => {}),
      index: async () => undefined,
      search: async () => [],
      remove: async () => undefined,
    };

    await expect(
      configureAllTenantSearchIndexes(fakeDb, registry, hangingAdapter, 50),
    ).rejects.toThrow(/t-1/);
  });
});
