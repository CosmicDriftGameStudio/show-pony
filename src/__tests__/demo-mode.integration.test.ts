// Regression pin for the demo-mode.ts wrapper: withDemoReadOnlyFetch wraps
// `handle.fetch` in bin/main.ts, and that wiring is the ONLY thing stopping
// an anonymous sysadmin login on the live demo from performing real
// cross-tenant writes. If a future refactor drops the wrapper (new fetch
// export, wrapper reordered, wrapper forgotten), nothing today catches it —
// the demo would just start allowing writes, silently.
//
// This test runs the real login handler + real dispatcher through the real
// wrapper (not a mocked inner fetch, unlike demo-mode.test.ts) over the
// public host origin, matching how bin/main.ts actually wires it. It pins
// the guard logic against real routes (new route / reordered guard) — it
// does NOT catch `withDemoReadOnlyFetch(handle.fetch)` itself being dropped
// from bin/main.ts, which would need a full bootstrap-level test.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { AuthErrors, AuthHandlers } from "@cosmicdrift/kumiko-bundled-features/auth-email-password";
import { seedAdmin } from "@cosmicdrift/kumiko-bundled-features/auth-email-password/seeding";
import { createComplianceProfilesFeature } from "@cosmicdrift/kumiko-bundled-features/compliance-profiles";
import { configValuesTable } from "@cosmicdrift/kumiko-bundled-features/config";
import {
  TenantHandlers,
  TenantQueries,
  tenantMembershipsTable,
  tenantTable,
} from "@cosmicdrift/kumiko-bundled-features/tenant";
import { createTenantLifecycleFeature } from "@cosmicdrift/kumiko-bundled-features/tenant-lifecycle";
import { UserQueries, userTable } from "@cosmicdrift/kumiko-bundled-features/user";
import type { TenantId } from "@cosmicdrift/kumiko-framework/engine";
import {
  setupTestStack,
  type TestStack,
  unsafePushTables,
} from "@cosmicdrift/kumiko-framework/stack";
import { composeFeatures } from "@cosmicdrift/kumiko-server-runtime/compose-features";
import { withDemoReadOnlyFetch } from "../demo-mode";

const BASE_DOMAIN = "show-pony.test";
const APEX_ORIGIN = `https://${BASE_DOMAIN}`;
const PLATFORM_TENANT = "00000000-0000-4000-8000-000000000099" as TenantId;
const SYSADMIN_EMAIL = "sysadmin@demo.test";
const SYSADMIN_PASSWORD = "correct-horse-battery-1234";

type FetchHandler = (req: Request) => Response | Promise<Response>;

let stack: TestStack;

beforeAll(async () => {
  stack = await setupTestStack({
    features: composeFeatures([createComplianceProfilesFeature(), createTenantLifecycleFeature()], {
      includeBundled: true,
    }),
    authConfig: {
      membershipQuery: TenantQueries.memberships,
      userQuery: UserQueries.findForAuth,
      loginHandler: AuthHandlers.login,
      loginErrorStatusMap: {
        [AuthErrors.invalidCredentials]: 401,
        [AuthErrors.noMembership]: 403,
      },
      allowedOrigins: [APEX_ORIGIN],
    },
  });

  await unsafePushTables(stack.db, {
    config_values: configValuesTable,
    users: userTable,
    tenants: tenantTable,
    tenant_memberships: tenantMembershipsTable,
  });

  // Same anchor pattern as bin/demo-tenants.ts seedSysadmin: a "User"
  // membership on the platform tenant satisfies the login handler's
  // membership requirement, SystemAdmin comes from the global role.
  await seedAdmin(stack.db, {
    email: SYSADMIN_EMAIL,
    password: SYSADMIN_PASSWORD,
    displayName: "Sysadmin",
    globalRoles: ["SystemAdmin"],
    memberships: [
      {
        tenantId: PLATFORM_TENANT,
        tenantKey: "_platform",
        tenantName: "Platform",
        roles: ["User"],
      },
    ],
  });
});

afterAll(() => stack?.cleanup());

async function loginAsSysadmin(fetch: FetchHandler): Promise<string> {
  const res = await fetch(
    new Request(`${APEX_ORIGIN}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: APEX_ORIGIN, Host: BASE_DOMAIN },
      body: JSON.stringify({ email: SYSADMIN_EMAIL, password: SYSADMIN_PASSWORD }),
    }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { token: string };
  return body.token;
}

async function attemptTenantCreate(
  fetch: FetchHandler,
  token: string,
  key: string,
): Promise<Response> {
  return await fetch(
    new Request(`${APEX_ORIGIN}/api/write`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: APEX_ORIGIN,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type: TenantHandlers.create, payload: { key, name: key } }),
    }),
  );
}

describe("demo read-only wrapper stays wired to the real write path", () => {
  test("anonymous-demo sysadmin write is 403'd when DEMO_READ_ONLY=true", async () => {
    const guardedFetch = withDemoReadOnlyFetch(stack.app.fetch.bind(stack.app), {
      DEMO_READ_ONLY: "true",
    });

    const token = await loginAsSysadmin(guardedFetch);
    const res = await attemptTenantCreate(guardedFetch, token, "regression-check-blocked");

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("demo_read_only");
  });

  test("control: the same sysadmin write succeeds when DEMO_READ_ONLY is unset", async () => {
    const openFetch = withDemoReadOnlyFetch(stack.app.fetch.bind(stack.app), {});

    const token = await loginAsSysadmin(openFetch);
    const res = await attemptTenantCreate(openFetch, token, "regression-check-allowed");

    expect(res.status).toBe(200);
    const body = (await res.json()) as { isSuccess: boolean };
    expect(body.isSuccess).toBe(true);
  });
});
