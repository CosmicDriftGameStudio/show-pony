import { describe, expect, test } from "bun:test";
import { type AccessRule, access, createRegistry } from "@cosmicdrift/kumiko-framework/engine";
import { appShellFeature } from "../features/app-shell/feature";
import { showPonyFeature } from "../features/show-pony/feature";

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

  test("system check: SystemAdmin in the platform, no entry in the host workspace", () => {
    const registry = createRegistry([appShellFeature]);
    const hostNav = registry.getWorkspace("app-shell:workspace:host")?.nav ?? [];
    const platformNav = registry.getWorkspace("app-shell:workspace:platform")?.nav ?? [];
    const systemCheckNavs = [
      ...Object.values(appShellFeature.navs),
      ...Object.values(showPonyFeature.navs),
    ].filter((nav) => nav.screen === "readiness:screen:system-check");

    expect(platformNav).toContain("app-shell:nav:system-check");
    expect(hostNav.filter((qn) => qn.endsWith(":nav:system-check"))).toEqual([]);
    expect(systemCheckNavs).toHaveLength(1);
    expect(expectRoles(appShellFeature.navs["system-check"]?.access)).toEqual(access.systemAdmin);
  });
});
