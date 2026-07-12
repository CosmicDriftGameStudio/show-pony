import { describe, expect, test } from "bun:test";
import { access, createRegistry } from "@cosmicdrift/kumiko-framework/engine";
import { appShellFeature } from "../features/app-shell/feature";

describe("show-pony app-shell workspaces", () => {
  test("host workspace excludes SystemAdmin; platform stays SystemAdmin-only", () => {
    const registry = createRegistry([appShellFeature]);
    const host = registry.getWorkspace("app-shell:workspace:host");
    const platform = registry.getWorkspace("app-shell:workspace:platform");
    expect(host?.access?.roles).toEqual(["TenantAdmin", "Admin"]);
    expect(host?.access?.roles).not.toContain("SystemAdmin");
    expect(platform?.access?.roles).toEqual(access.systemAdmin);
  });
});
