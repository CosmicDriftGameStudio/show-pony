import { describe, expect, test } from "bun:test";
import { createShowPonyDevHostDispatch } from "../host-dispatch";

const BASE_DOMAIN = "show-pony.test";
const dispatch = createShowPonyDevHostDispatch(BASE_DOMAIN);

// Apex marketing routes never reach the host-routing branch, so the query is never called.
const deps = {
  cspScriptHashes: [],
  systemQuery: async () => {
    throw new Error("systemQuery must not be called for apex marketing routes");
  },
};

function dispatchApex(path: string) {
  return dispatch(new Request(`http://${BASE_DOMAIN}${path}`), deps);
}

describe("show-pony dev host dispatch (apex marketing)", () => {
  test("/ serves the english home page", async () => {
    expect(await dispatchApex("/")).toEqual({
      kind: "static-html",
      file: "dist/pages/en/index.html",
    });
  });

  test("legacy /en redirects to /", async () => {
    expect(await dispatchApex("/en")).toEqual({ kind: "redirect", to: "/", status: 301 });
  });

  test("/de/preise serves the german pricing page", async () => {
    expect(await dispatchApex("/de/preise")).toEqual({
      kind: "static-html",
      file: "dist/pages/de/pricing/index.html",
    });
  });

  test("/features serves the english features page", async () => {
    expect(await dispatchApex("/features")).toEqual({
      kind: "static-html",
      file: "dist/pages/en/features/index.html",
    });
  });
});
