import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { BRANDING_QN, createBrandingFeature } from "@cosmicdrift/kumiko-bundled-features/branding";
import { createInMemoryTransport } from "@cosmicdrift/kumiko-bundled-features/channel-email";
import {
  configValuesTable,
  createConfigAccessorFactory,
  createConfigFeature,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { createManagedPagesFeature } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import { seedTenant, setupAppTestStack } from "@cosmicdrift/kumiko-dev-server/testing";
import { createSystemUser, type SessionUser } from "@cosmicdrift/kumiko-framework/engine";
import { type TestStack, unsafePushTables } from "@cosmicdrift/kumiko-testing/stack";
import { showPonyFeature } from "../features/show-pony/feature";
import { INVITE_BRANDING_QN } from "../features/show-pony/invite-branding";
import { tierAssignmentTable } from "../features/show-pony/tier-resolver";
import { deliveryFeatures } from "./delivery-stack";
import { hostRoutingAnonymousAccess, hostRoutingFeatures } from "./host-routing-stack";

const BASE_DOMAIN = "show-pony.test";

const configResolver = createConfigResolver();

const managedPages = createManagedPagesFeature({});

let stack: TestStack;
let demoId: string;
let acmeId: string;
let demoHostname: string;
let acmeHostname: string;
let acmeAdmin: SessionUser;
let acme: Awaited<ReturnType<typeof seedTenant>>;

beforeAll(async () => {
  stack = await setupAppTestStack(
    [
      ...hostRoutingFeatures(BASE_DOMAIN),
      createConfigFeature(),
      createBrandingFeature(),
      managedPages,
      ...deliveryFeatures(createInMemoryTransport()),
      showPonyFeature,
    ],
    {
      ...hostRoutingAnonymousAccess,
      extraContext: ({ registry }) => ({
        configResolver,
        configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
      }),
    },
  );
  await unsafePushTables(stack.db, {
    configValuesTable,
    tier_assignments: tierAssignmentTable,
  });
  // Subdomain routing resolves the tenant via a DB lookup by key, so the tenants need persisted rows.
  const demo = await seedTenant(stack, { name: "Demo", persist: true });
  acme = await seedTenant(stack, { name: "Acme", persist: true });
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

  test("a signed-in caller with a non-admin app role reads the branding", async () => {
    const member = (await acme.addUser(["Member"])).session;
    const branding = await stack.http.queryOk<{ heroStyle?: string }>(
      "showpony:query:invite-branding",
      {},
      member,
    );
    expect(branding.heroStyle).toBeDefined();
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
