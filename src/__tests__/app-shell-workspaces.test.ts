import { describe, expect, test } from "bun:test";
import { access, createRegistry, type AccessRule } from "@cosmicdrift/kumiko-framework/engine";
import { appShellFeature } from "../features/app-shell/feature";

function expectRoles(rule: AccessRule | undefined): readonly string[] {
  expect(rule).toBeDefined();
  if (!rule || !("roles" in rule)) throw new Error("expected roles access rule");
  return rule.roles;
}

describe("show-pony app-shell workspaces", () => {
  test("host workspace excludes SystemAdmin; platform stays SystemAdmin-only", () => {
    const registry = createRegistry([appShellFeature]);
    const host = registry.getWorkspace("app-shell:workspace:host");
    const platform = registry.getWorkspace("app-shell:workspace:platform");
    expect(expectRoles(host?.access)).toEqual(["TenantAdmin", "Admin"]);
    expect(expectRoles(host?.access)).not.toContain("SystemAdmin");
    expect(expectRoles(platform?.access)).toEqual(access.systemAdmin);
  });
});

