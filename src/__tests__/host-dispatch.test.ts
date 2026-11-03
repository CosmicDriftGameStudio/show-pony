import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { createShowPonyDevHostDispatch } from "../host-dispatch";

const keyPayload = z.object({ key: z.string() });
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

function dispatchTenantHost(host: string, knownKeys: readonly string[]) {
  return dispatch(new Request(`http://${host}/`), {
    cspScriptHashes: [],
    systemQuery: async (_type, payload) => {
      const { key } = keyPayload.parse(payload);
      return { exists: knownKeys.includes(key) };
    },
  });
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

describe("show-pony dev host dispatch (host-routing entries)", () => {
  test("apex login path serves the admin entry", async () => {
    expect(await dispatchApex("/login")).toEqual({ kind: "html", entryName: "admin" });
  });

  test("known tenant host serves the public entry", async () => {
    expect(await dispatchTenantHost(`acme.${BASE_DOMAIN}`, ["acme"])).toEqual({
      kind: "html",
      entryName: "public",
    });
  });

  test("unknown tenant host answers not-found with the public entry", async () => {
    expect(await dispatchTenantHost(`ghost.${BASE_DOMAIN}`, ["acme"])).toEqual({
      kind: "not-found",
      entryName: "public",
    });
  });
});
