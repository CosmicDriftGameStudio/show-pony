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
import { createSystemUser, type SessionUser } from "@cosmicdrift/kumiko-framework/engine";
import { type TestStack, unsafePushTables } from "@cosmicdrift/kumiko-framework/stack";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { showPonyFeature } from "../features/show-pony/feature";
import { INVITE_BRANDING_QN } from "../features/show-pony/invite-branding";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import {
  bindSubdomainPageResolver,
  createShowPonyTenantResolver,
  resolveSubdomainPageTenant,
} from "../tenant-routing";

const BASE_DOMAIN = "show-pony.test";

const configResolver = createConfigResolver({
  appOverrides: new Map([["mail-foundation:config:provider", "inmemory"]]),
});

// Real production wiring (run-config.ts): resolveApexTenant IS
// resolveSubdomainPageTenant, the actual Host→tenant parsing (apex/www
// exclusion + `.baseDomain` suffix lookup), not a hand-rolled stub — proves
// the prod path itself, not just the framework pipeline around it.
const managedPages = createManagedPagesFeature({
  resolveApexTenant: resolveSubdomainPageTenant,
});

let stack: TestStack;
let demoId: string;
let acmeId: string;
let demoHostname: string;
let acmeHostname: string;
let acmeAdmin: SessionUser;

beforeAll(async () => {
  stack = await setupAppTestStack(
    [
      createConfigFeature(),
      managedPages,
      mailFoundationFeature,
      mailTransportInMemoryFeature,
      showPonyFeature,
    ],
    {
      anonymousAccess: ({ db }) => {
        bindSubdomainPageResolver({ db, baseDomain: BASE_DOMAIN });
        return createShowPonyTenantResolver({ db, baseDomain: BASE_DOMAIN });
      },
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
  // Subdomain routing resolves the tenant via a real DB lookup by key
  // (tenant-routing.ts enabledTenantByKey) — needs persisted rows.
  const demo = await seedTenant(stack, { name: "Demo", persist: true });
  const acme = await seedTenant(stack, { name: "Acme", persist: true });
  demoId = demo.id;
  acmeId = acme.id;
  demoHostname = `${demo.key}.${BASE_DOMAIN}`;
  acmeHostname = `${acme.key}.${BASE_DOMAIN}`;
  acmeAdmin = (await acme.addUser(["Admin"])).session;
});

afterAll(async () => stack?.cleanup());

describe("invite-branding query", () => {
  test("returns tenant-scoped branding + hero fields for anonymous subdomain callers", async () => {
    await stack.dispatcher.write(
      "config:write:set",
      { key: BRANDING_QN.accentColor, value: "#7c3aed" },
      createSystemUser(demoId),
    );
    await stack.dispatcher.write(
      "config:write:set",
      { key: INVITE_BRANDING_QN.heroStyle, value: "immersive" },
      createSystemUser(demoId),
    );
    await stack.dispatcher.write(
      "config:write:set",
      { key: INVITE_BRANDING_QN.heroImageUrl, value: "/heroes/demo-rooftop.webp" },
      createSystemUser(demoId),
    );

    const res = await stack.http.raw(
      "POST",
      "/api/query",
      { type: "showpony:query:invite-branding", payload: {} },
      { Host: demoHostname },
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
      createSystemUser(acmeId),
    );
    await stack.dispatcher.write(
      "config:write:set",
      { key: INVITE_BRANDING_QN.heroStyle, value: "split" },
      createSystemUser(acmeId),
    );

    const acmeRes = await stack.http.raw(
      "POST",
      "/api/query",
      { type: "showpony:query:invite-branding", payload: {} },
      { Host: acmeHostname },
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
