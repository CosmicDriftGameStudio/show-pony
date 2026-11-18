import { describe, expect, test } from "bun:test";
import { type AccessRule, access, createRegistry } from "@cosmicdrift/kumiko-framework/engine";
import { composeFeatures } from "@cosmicdrift/kumiko-server-runtime/compose-features";
import { appShellFeature } from "../features/app-shell/feature";
import { buildAppFeatures, HAS_AUTH } from "../run-config";

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

  test("system check and users are collected into the platform workspace, never the host", () => {
    const registry = createRegistry(
      composeFeatures(buildAppFeatures({ baseDomain: "show-pony.test" }), {
        includeBundled: HAS_AUTH,
      }),
    );
    const hostNav = registry.getWorkspaceNavs("app-shell:workspace:host");
    const platformNav = registry.getWorkspaceNavs("app-shell:workspace:platform");

    expect(platformNav).toContain("readiness:nav:system-check");
    expect(platformNav).toContain("admin-shell:nav:users");
    expect(hostNav.filter((qn) => qn.endsWith(":nav:system-check"))).toEqual([]);
    expect(hostNav).toContain("audit:nav:audit-log");
    expect(Object.keys(appShellFeature.navs)).toEqual([]);
  });

  test("app-shell carries no system scope (it registers no handlers)", () => {
    expect(appShellFeature.systemScope).toBe(false);
    expect(
      Object.keys(appShellFeature.writeHandlers).length +
        Object.keys(appShellFeature.queryHandlers).length,
    ).toBe(0);
  });
});
