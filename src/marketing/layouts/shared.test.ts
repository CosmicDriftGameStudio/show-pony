import { describe, expect, test } from "bun:test";
import { SHARED_CSS } from "./shared";

describe("SHARED_CSS mobile nav-toggle", () => {
  test("re-enables the .nav-toggle hamburger under the mobile breakpoint", () => {
    expect(SHARED_CSS).toContain(".nav .nav-toggle { display: inline-flex; }");
    expect(SHARED_CSS).toContain(".nav .nav-toggle__trigger { display: inline-flex; }");
  });

  test("declares .nav as a positioned ancestor for the open dropdown", () => {
    expect(SHARED_CSS).toContain(".nav { position: relative; }");
  });

  test("the positioned-ancestor rule lands after HEADER_CSS's own .nav rule", () => {
    const headerNavIndex = SHARED_CSS.indexOf(".nav { display: flex;");
    const positionedIndex = SHARED_CSS.indexOf(".nav { position: relative; }");

    expect(headerNavIndex).toBeGreaterThan(-1);
    expect(positionedIndex).toBeGreaterThan(headerNavIndex);
  });
});
