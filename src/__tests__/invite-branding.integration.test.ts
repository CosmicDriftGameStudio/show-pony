import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  configValuesTable,
  createConfigAccessorFactory,
  createConfigFeature,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { mailTransportInMemoryFeature } from "@cosmicdrift/kumiko-bundled-features/mail-transport-inmemory";
import {
  BRANDING_QN,
  createManagedPagesFeature,
} from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { tenantEntity } from "@cosmicdrift/kumiko-bundled-features/tenant";
import { seedTenant } from "@cosmicdrift/kumiko-bundled-features/tenant/seeding";
import { createSystemUser } from "@cosmicdrift/kumiko-framework/engine";
import { createEventsTable } from "@cosmicdrift/kumiko-framework/event-store";
import {
  setupTestStack,
  type TestStack,
  TestUsers,
  testTenantId,
  unsafeCreateEntityTable,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import { showPonyFeature } from "../features/show-pony/feature";
import { INVITE_BRANDING_QN } from "../features/show-pony/invite-branding";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { bindSubdomainPageResolver, createShowPonyTenantResolver } from "../tenant-routing";

const BASE_DOMAIN = "show-pony.test";
const DEMO = testTenantId(1);
const ACME = testTenantId(2);

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

const managedPages = createManagedPagesFeature({
  resolveApexTenant: async (host) => {
    if (host.startsWith("demo.")) return DEMO;
    if (host.startsWith("acme.")) return ACME;
    return null;
  },
});

let stack: TestStack;
const acmeAdmin = { ...TestUsers.admin, tenantId: ACME, id: "acme-admin-id" };

beforeAll(async () => {
  stack = await setupTestStack({
    features: [
      createConfigFeature(),
      managedPages,
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    anonymousAccess: ({ db }) => {
      bindSubdomainPageResolver({ db, baseDomain: BASE_DOMAIN });
      return createShowPonyTenantResolver({ db, baseDomain: BASE_DOMAIN });
    },
    extraContext: ({ registry }) => ({
      configResolver,
      _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    }),
  });
  await unsafeCreateEntityTable(stack.db, tenantEntity);
  await unsafePushTables(stack.db, {
    configValuesTable,
    tier_assignments: tierAssignmentTable,
  });
  await createEventsTable(stack.db);
  await seedTenant(stack.db, { id: DEMO, key: "demo", name: "Demo" });
  await seedTenant(stack.db, { id: ACME, key: "acme", name: "Acme" });
});

afterAll(async () => stack?.cleanup());

describe("invite-branding query", () => {
  test("returns tenant-scoped branding + hero fields for anonymous subdomain callers", async () => {
    await stack.dispatcher.write(
      "config:write:set",
      { key: BRANDING_QN.accentColor, value: "#7c3aed" },
      createSystemUser(DEMO),
    );
    await stack.dispatcher.write(
      "config:write:set",
      { key: INVITE_BRANDING_QN.heroStyle, value: "immersive" },
      createSystemUser(DEMO),
    );
    await stack.dispatcher.write(
      "config:write:set",
      { key: INVITE_BRANDING_QN.heroImageUrl, value: "/heroes/demo-rooftop.webp" },
      createSystemUser(DEMO),
    );

    const res = await stack.http.raw(
      "POST",
      "/api/query",
      { type: "showpony:query:invite-branding", payload: {} },
      { Host: "demo.show-pony.test" },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { accentColor: string; heroStyle: string; heroImageUrl: string };
    };
    expect(body.data).toMatchObject({
      accentColor: "#7c3aed",
      heroStyle: "immersive",
      heroImageUrl: "/heroes/demo-rooftop.webp",
    });

    await stack.dispatcher.write(
      "config:write:set",
      { key: BRANDING_QN.accentColor, value: "#0d9488" },
      createSystemUser(ACME),
    );
    await stack.dispatcher.write(
      "config:write:set",
      { key: INVITE_BRANDING_QN.heroStyle, value: "split" },
      createSystemUser(ACME),
    );

    const acmeRes = await stack.http.raw(
      "POST",
      "/api/query",
      { type: "showpony:query:invite-branding", payload: {} },
      { Host: "acme.show-pony.test" },
    );
    const acmeBody = (await acmeRes.json()) as {
      data: { accentColor: string; heroStyle: string };
    };
    expect(acmeBody.data.accentColor).toBe("#0d9488");
    expect(acmeBody.data.heroStyle).toBe("split");
    expect(acmeBody.data.accentColor).not.toBe("#7c3aed");
  });

  test("invite-branding-settings screen is registered", () => {
    expect(Object.keys(showPonyFeature.screens)).toContain("invite-branding-settings");
  });

  test("tenant admin can write hero image URL (relative path allowed)", async () => {
    await stack.http.writeOk(
      "config:write:set",
      { key: INVITE_BRANDING_QN.heroImageUrl, value: "/heroes/acme-studio.webp" },
      acmeAdmin,
    );
    const branding = await stack.http.queryOk<{ heroImageUrl: string }>(
      "showpony:query:invite-branding",
      {},
      acmeAdmin,
    );
    expect(branding.heroImageUrl).toBe("/heroes/acme-studio.webp");
  });
});
