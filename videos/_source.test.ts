import { describe, expect, test } from "bun:test";
import { fileLines } from "./_source";

const FILE = "videos/from-scratch/text.en.yaml";

describe("fileLines", () => {
  test("returns the range and marks typed lines", () => {
    const lines = fileLines(FILE, 1, 3, [2], "");
    expect(lines).toHaveLength(3);
    expect(typeof lines[0]).toBe("string");
    expect(lines[1]).toHaveProperty("typed");
    expect(typeof lines[2]).toBe("string");
  });

  test("throws when the range no longer starts with the expected text", () => {
    expect(() => fileLines(FILE, 1, 3, [], "definitely-not-there")).toThrow(/no longer starts/);
  });

  test("throws when a typed line is outside the range", () => {
    expect(() => fileLines(FILE, 1, 3, [9], "")).toThrow(/outside/);
  });
});
