import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { setupAppTestStack } from "@cosmicdrift/kumiko-dev-server/testing";
import { expectRoleRestrictedHandlersDenyForeignRole } from "@cosmicdrift/kumiko-testing/helpers";
import type { TestStack } from "@cosmicdrift/kumiko-testing/stack";
import { buildAppFeatures } from "../run-config";
import { hostRoutingAnonymousAccess } from "./host-routing-stack";

const configResolver = createConfigResolver();

let stack: TestStack;

beforeAll(async () => {
  stack = await setupAppTestStack(buildAppFeatures({ baseDomain: "show-pony-roles.test" }), {
    ...hostRoutingAnonymousAccess,
    extraContext: ({ registry }) => ({
      configResolver,
      _configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    }),
  });
});

afterAll(async () => stack?.cleanup());

describe("role-restricted handlers", () => {
  test("deny a signed-in caller without any of the required roles", async () => {
    const counts = await expectRoleRestrictedHandlersDenyForeignRole(stack, {
      minimumHandlerCount: 1,
    });
    expect(counts.checkedWriteHandlers + counts.checkedQueryHandlers).toBeGreaterThan(0);
  });
});
