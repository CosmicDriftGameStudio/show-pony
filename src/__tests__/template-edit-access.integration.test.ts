// Runs against the app's real composition (buildAppFeatures), so the tenantEditable /
// templateEditAccess wiring in run-config.ts is what is exercised, not a hand-built copy.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import {
  TemplateResolverHandlers,
  TemplateResolverQueries,
} from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import { seedNotificationTemplates } from "@cosmicdrift/kumiko-bundled-features/template-resolver/seeding";
import { setupAppTestStack } from "@cosmicdrift/kumiko-dev-server/testing";
import { createTestUser, testTenantId } from "@cosmicdrift/kumiko-framework/seeding";
import type { TestStack } from "@cosmicdrift/kumiko-testing/stack";
import { RSVP_CONFIRMATION_TYPE } from "../features/show-pony/lib/rsvp-confirmation-mail";
import { buildAppFeatures } from "../run-config";
import { hostRoutingAnonymousAccess } from "./host-routing-stack";

const configResolver = createConfigResolver();

const tenantAdmin = createTestUser({ id: 71, roles: ["TenantAdmin"], tenantId: testTenantId(71) });
const plainUser = createTestUser({ id: 72, roles: ["User"], tenantId: testTenantId(72) });
const NOT_EDITABLE_SLUG = "showpony:notify:other-mail";
const OWN_BODY = "<p>Eigen</p>";

type OverviewResult = { rows: ReadonlyArray<{ slug: string; kind: string }> };
type TemplateRow = { content: string; scope: string; tenantId: string; slug: string };

function mailPayload(slug: string) {
  return {
    slug,
    kind: "mail",
    locale: "de",
    contentFormat: "html" as const,
    variableSchema: {},
    linkedResources: {},
    meta: { subject: "Betreff" },
    content: OWN_BODY,
  };
}

let stack: TestStack;

beforeAll(async () => {
  stack = await setupAppTestStack(buildAppFeatures({ baseDomain: "show-pony-templates.test" }), {
    ...hostRoutingAnonymousAccess,
    extraContext: ({ registry }) => ({
      configResolver,
      configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    }),
  });
  await seedNotificationTemplates(stack.db, stack.registry);
});

afterAll(async () => stack?.cleanup());

describe("template edit access", () => {
  test("a TenantAdmin edits the RSVP confirmation mail and reads the override back", async () => {
    const written = await stack.http.writeOk<{ id: string }>(
      TemplateResolverHandlers.upsertTenant,
      mailPayload(RSVP_CONFIRMATION_TYPE),
      tenantAdmin,
    );

    const stored = await stack.http.queryOk<TemplateRow>(
      TemplateResolverQueries.findById,
      { id: written.id },
      tenantAdmin,
    );
    expect(stored.slug).toBe(RSVP_CONFIRMATION_TYPE);
    expect(stored.scope).toBe("tenant");
    expect(stored.tenantId).toBe(tenantAdmin.tenantId);
    expect(stored.content).toBe(OWN_BODY);
  });

  test("a TenantAdmin is refused on any other template", async () => {
    const error = await stack.http.writeErr(
      TemplateResolverHandlers.upsertTenant,
      mailPayload(NOT_EDITABLE_SLUG),
      tenantAdmin,
    );
    expect(error.i18nKey).toBe("templateResolver.errors.templateNotTenantEditable");
  });

  test("a user without the TenantAdmin role cannot edit the RSVP confirmation mail", async () => {
    const error = await stack.http.writeErr(
      TemplateResolverHandlers.upsertTenant,
      mailPayload(RSVP_CONFIRMATION_TYPE),
      plainUser,
    );
    expect(error.i18nKey).toBe("errors.access.denied");
  });

  test("the designer's template overview lists only the RSVP mail for a TenantAdmin", async () => {
    const overview = await stack.http.queryOk<OverviewResult>(
      TemplateResolverQueries.overview,
      {},
      tenantAdmin,
    );
    const slugs = overview.rows.map((row) => row.slug);
    expect(slugs).toContain(RSVP_CONFIRMATION_TYPE);
    expect(slugs.filter((slug) => slug !== RSVP_CONFIRMATION_TYPE)).toEqual([]);
  });

  test("the designer's template overview is closed to a plain user", async () => {
    const error = await stack.http.queryErr(TemplateResolverQueries.overview, {}, plainUser);
    expect(error.i18nKey).toBe("errors.access.denied");
  });
});
