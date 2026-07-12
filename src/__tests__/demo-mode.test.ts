import { describe, expect, test } from "bun:test";
import { demoModePayload, isDemoReadOnly, withDemoReadOnlyFetch } from "../demo-mode";

describe("demo-mode", () => {
  test("isDemoReadOnly respects env", () => {
    expect(isDemoReadOnly({ DEMO_READ_ONLY: "true" })).toBe(true);
    expect(isDemoReadOnly({ DEMO_READ_ONLY: "1" })).toBe(true);
    expect(isDemoReadOnly({})).toBe(false);
  });

  test("demoModePayload exposes accounts only when read-only", () => {
    const open = demoModePayload({});
    expect(open.readOnly).toBe(false);
    expect(open.accounts).toEqual([]);

    const ro = demoModePayload({
      DEMO_READ_ONLY: "true",
      DEMO_ADMIN_EMAIL: "host@demo.test",
      DEMO_ADMIN_PASSWORD: "secret",
      DEMO_SYSADMIN_EMAIL: "sys@demo.test",
      DEMO_SYSADMIN_PASSWORD: "secret2",
      BASE_DOMAIN: "show-pony.kumiko.rocks",
    });
    expect(ro.readOnly).toBe(true);
    expect(ro.accounts).toHaveLength(2);
    expect(ro.hostLoginUrl).toBe("https://show-pony.kumiko.rocks");
  });

  test("withDemoReadOnlyFetch blocks POST /api/write", async () => {
    const inner = async (req: Request) =>
      Response.json({ ok: true, path: new URL(req.url).pathname });
    const guarded = withDemoReadOnlyFetch(inner, { DEMO_READ_ONLY: "true" });
    const blocked = await guarded(
      new Request("https://show-pony.kumiko.rocks/api/write", { method: "POST" }),
    );
    expect(blocked.status).toBe(403);
    const allowed = await guarded(
      new Request("https://show-pony.kumiko.rocks/api/query", { method: "POST" }),
    );
    expect(allowed.status).toBe(200);
  });
});
