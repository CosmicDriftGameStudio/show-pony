import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  configValuesTable,
  createConfigAccessorFactory,
  createConfigFeature,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { mailTransportInMemoryFeature } from "@cosmicdrift/kumiko-bundled-features/mail-transport-inmemory";
import { createManagedPagesFeature } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { TenantHandlers } from "@cosmicdrift/kumiko-bundled-features/tenant";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import type { SearchAdapter, SearchAdapterConfig } from "@cosmicdrift/kumiko-framework/search";
import {
  createTestUser,
  type TestStack,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import {
  collectSearchableFieldNames,
  configureAllTenantSearchIndexes,
} from "../../bin/search-wiring";
import { showPonyFeature } from "../features/show-pony/feature";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { createShowPonyAnonymousAccess } from "../tenant-routing";

const BASE_DOMAIN = "show-pony.test";
const PLATFORM_TENANT = "00000000-0000-4000-8000-000000000001";

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

let stack: TestStack;
let activeTenantId: TenantId;
let disabledTenantId: TenantId;

beforeAll(async () => {
  stack = await setupAppTestStack(
    [
      createConfigFeature(),
      createManagedPagesFeature({ resolveApexTenant: async () => null }),
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    {
      anonymousAccess: ({ db }) => createShowPonyAnonymousAccess({ db, baseDomain: BASE_DOMAIN }),
      extraContext: ({ registry }) => ({
        configResolver,
        _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
      }),
    },
  );
  await unsafePushTables(stack.db, {
    configValuesTable,
    tier_assignments: tierAssignmentTable,
  });
  activeTenantId = (await seedTenant(stack, { name: "Active Host", persist: true })).id as TenantId;
  disabledTenantId = (await seedTenant(stack, { name: "Disabled Host", persist: true }))
    .id as TenantId;
  const sysadmin = createTestUser({
    id: "search-wiring-sysadmin",
    tenantId: PLATFORM_TENANT,
    roles: ["SystemAdmin"],
  });
  await stack.http.writeOk(TenantHandlers.disable, { id: disabledTenantId }, sysadmin);
});

afterAll(async () => {
  await stack?.cleanup();
});

function recordingAdapter(configureImpl?: SearchAdapter["configure"]) {
  const calls: Array<{ tenantId: TenantId; config: SearchAdapterConfig }> = [];
  const adapter: SearchAdapter = {
    configure:
      configureImpl ??
      (async (tenantId, config) => {
        calls.push({ tenantId, config });
      }),
    index: async () => undefined,
    search: async () => [],
    remove: async () => undefined,
  };
  return { adapter, calls };
}

describe("configureAllTenantSearchIndexes (real DB)", () => {
  test("configures only enabled tenants with the searchable-field union, returns the tenant count", async () => {
    const { adapter, calls } = recordingAdapter();

    const count = await configureAllTenantSearchIndexes(stack.db, stack.registry, adapter);

    const configuredIds = calls.map((c) => c.tenantId);
    expect(configuredIds).toContain(activeTenantId);
    expect(configuredIds).not.toContain(disabledTenantId);
    expect(count).toBe(calls.length);
    const expectedFields = [...collectSearchableFieldNames(stack.registry)].sort();
    expect(expectedFields.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.config.searchableFields.slice().sort()).toEqual(expectedFields);
      expect(call.config.rankingFields?.slice().sort()).toEqual(expectedFields);
    }
  });

  test("rejects with the tenant id when a configure() call hangs", async () => {
    const { adapter } = recordingAdapter(() => new Promise(() => {}));

    await expect(
      configureAllTenantSearchIndexes(stack.db, stack.registry, adapter, 50),
    ).rejects.toThrow(new RegExp(activeTenantId));
  });
});
