import { describe, expect, test } from "bun:test";
import { normalizedTint } from "../InviteHero";

describe("normalizedTint", () => {
  test("expands a 3-digit hex", () => {
    expect(normalizedTint("#abc")).toBe("#aabbcc");
  });
  test("keeps a 6-digit hex", () => {
    expect(normalizedTint("#7c3aed")).toBe("#7c3aed");
  });
  test("strips the alpha channel of an 8-digit hex", () => {
    expect(normalizedTint("#7c3aedcc")).toBe("#7c3aed");
  });
  test("falls back to the default purple", () => {
    expect(normalizedTint("")).toBe("#7c3aed");
  });
});
