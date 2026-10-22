import { describe, expect, test } from "bun:test";
import { SEED_PASSWORD_MIN_LENGTH, showPonyEnvSchema } from "../env-schema";
import { buildDemoModeOption } from "../prod-options";

const { shape } = showPonyEnvSchema.schema;

describe("seed password length", () => {
  for (const key of ["DEMO_ADMIN_PASSWORD", "DEMO_SYSADMIN_PASSWORD"] as const) {
    test(`${key} rejects ${SEED_PASSWORD_MIN_LENGTH - 1} chars and accepts ${SEED_PASSWORD_MIN_LENGTH}`, () => {
      expect(shape[key].safeParse("a".repeat(SEED_PASSWORD_MIN_LENGTH - 1)).success).toBe(false);
      expect(shape[key].safeParse("a".repeat(SEED_PASSWORD_MIN_LENGTH)).success).toBe(true);
    });
  }
});

describe("buildDemoModeOption", () => {
  test.each(["true", "1"])("DEMO_READ_ONLY=%s enables readOnly", (value) => {
    expect(buildDemoModeOption({ DEMO_READ_ONLY: value }, "x.test").readOnly).toBe(true);
  });

  test.each([undefined, "false", "0"])("DEMO_READ_ONLY=%p keeps writes enabled", (value) => {
    expect(buildDemoModeOption({ DEMO_READ_ONLY: value }, "x.test").readOnly).toBe(false);
  });
});
