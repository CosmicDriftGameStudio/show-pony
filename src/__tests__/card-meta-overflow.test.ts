import { describe, expect, test } from "bun:test";
import { collectCardMetaOverflow } from "@cosmicdrift/kumiko-framework/engine";
import { buildAppFeatures } from "../run-config";

describe("show-pony list cards", () => {
  test("no list exceeds the narrow-card meta column limit", () => {
    expect(
      collectCardMetaOverflow(buildAppFeatures({ baseDomain: "show-pony.localhost" })),
    ).toEqual([]);
  });
});
