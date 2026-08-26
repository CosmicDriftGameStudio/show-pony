import { describe, expect, test } from "bun:test";
import { APEX_NAV_TOGGLE_RESPONSIVE_CSS } from "@cosmicdrift/kumiko-headless/apex";
import { SHARED_CSS } from "./shared";

describe("SHARED_CSS mobile nav-toggle", () => {
  test("includes the framework responsive nav-toggle bundle", () => {
    expect(SHARED_CSS).toContain(APEX_NAV_TOGGLE_RESPONSIVE_CSS);
  });

  test("styles nav-toggle triggers for the dark marketing header chrome", () => {
    expect(SHARED_CSS).toContain(".nav-toggle__trigger { color: var(--on-dark-muted); }");
    expect(SHARED_CSS).toContain(".nav-toggle__trigger:hover { color: var(--on-dark); }");
  });
});
