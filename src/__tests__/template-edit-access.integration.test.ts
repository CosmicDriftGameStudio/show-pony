import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createTemplateResolverFeature,
  TemplateResolverHandlers,
} from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import { setupAppTestStack } from "@cosmicdrift/kumiko-dev-server/testing";
import { createTestUser, testTenantId } from "@cosmicdrift/kumiko-framework/seeding";
import type { TestStack } from "@cosmicdrift/kumiko-testing/stack";
import { RSVP_CONFIRMATION_TYPE } from "../features/show-pony/lib/rsvp-confirmation-mail";
import { TENANT_EDITABLE_TEMPLATES } from "../features/show-pony/tenant-editable-templates";

const tenantAdmin = createTestUser({ id: 71, roles: ["TenantAdmin"], tenantId: testTenantId(71) });
const NOT_EDITABLE_SLUG = "showpony:notify:other-mail";

function mailPayload(slug: string) {
  return {
    slug,
    kind: "mail",
    locale: "de",
    contentFormat: "html" as const,
    variableSchema: {},
    linkedResources: {},
    meta: { subject: "Betreff" },
    content: "<p>Eigen</p>",
  };
}

let stack: TestStack;

beforeAll(async () => {
  stack = await setupAppTestStack([
    createTemplateResolverFeature({ tenantEditable: TENANT_EDITABLE_TEMPLATES }),
  ]);
});

afterAll(async () => stack?.cleanup());

describe("template edit access", () => {
  test("a TenantAdmin edits the RSVP confirmation mail", async () => {
    await stack.http.writeOk(
      TemplateResolverHandlers.upsertTenant,
      mailPayload(RSVP_CONFIRMATION_TYPE),
      tenantAdmin,
    );
  });

  test("a TenantAdmin is refused on any other template", async () => {
    const error = await stack.http.writeErr(
      TemplateResolverHandlers.upsertTenant,
      mailPayload(NOT_EDITABLE_SLUG),
      tenantAdmin,
    );
    expect(error.i18nKey).toBe("templateResolver.errors.templateNotTenantEditable");
  });
});
