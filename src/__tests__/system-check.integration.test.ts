// Real HTTP round-trip of the readiness system check on the full show-pony feature set. show-pony mounts
// no mail, file or inbound-mail foundation, so a tenant run finishes with no probes at all and only the
// SystemAdmin sees results (the built-in database, cache and search probes).

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createConfigAccessorFactory,
  createConfigResolver,
} from "@cosmicdrift/kumiko-bundled-features/config";
import { ReadinessQueries, ReadinessWrites } from "@cosmicdrift/kumiko-bundled-features/readiness";
import { setupAppTestStack } from "@cosmicdrift/kumiko-dev-server/testing";
import { createTestUser, testTenantId } from "@cosmicdrift/kumiko-framework/seeding";
import type { TestStack } from "@cosmicdrift/kumiko-testing/stack";
import { buildAppFeatures } from "../run-config";

type ProbeRow = { readonly probe: string; readonly status: "ok" | "failed" | "skipped" };
type LatestResults = { readonly rows: readonly ProbeRow[] };
type LatestSummary = {
  readonly runId: string | null;
  readonly status?: string;
  readonly okCount: number;
  readonly failedCount: number;
  readonly skippedCount: number;
};

const SYSTEM_ONLY_PROBE = "readiness:probe:database";

const configResolver = createConfigResolver();

let stack: TestStack;

beforeAll(async () => {
  stack = await setupAppTestStack(buildAppFeatures({ baseDomain: "show-pony-readiness.test" }), {
    includeBundled: true,
    jobs: { consumerLane: "worker" },
    extraContext: ({ registry }) => ({
      configResolver,
      configAccessorFactory: createConfigAccessorFactory(registry, configResolver),
    }),
  });
});

afterAll(async () => stack?.cleanup());

describe("system check", () => {
  test("a TenantAdmin run finishes without the system probes", async () => {
    const tenantAdmin = createTestUser({ tenantId: testTenantId(901), roles: ["TenantAdmin"] });

    const started = await stack.http.writeOk<{ runId: string; isExisting: boolean }>(
      ReadinessWrites.runProbes,
      {},
      tenantAdmin,
    );
    await stack.drainJobs();

    const summary = await stack.http.queryOk<LatestSummary>(
      ReadinessQueries.latestSummary,
      {},
      tenantAdmin,
    );
    const { rows } = await stack.http.queryOk<LatestResults>(
      ReadinessQueries.latestResults,
      {},
      tenantAdmin,
    );

    expect(started.isExisting).toBe(false);
    expect(summary.runId).toBe(started.runId);
    expect(summary.status).toBe("done");
    expect(summary.okCount + summary.failedCount + summary.skippedCount).toBe(rows.length);
    expect(rows.some((row) => row.probe === SYSTEM_ONLY_PROBE)).toBe(false);
  });

  test("a SystemAdmin run also reports the system probes", async () => {
    const systemAdmin = createTestUser({ tenantId: testTenantId(902), roles: ["SystemAdmin"] });

    await stack.http.writeOk(ReadinessWrites.runProbes, {}, systemAdmin);
    await stack.drainJobs();
    const { rows } = await stack.http.queryOk<LatestResults>(
      ReadinessQueries.latestResults,
      {},
      systemAdmin,
    );

    expect(rows.find((row) => row.probe === SYSTEM_ONLY_PROBE)?.status).toBe("ok");
  });

  test("an Admin of the host workspace can neither start a run nor read its results", async () => {
    const admin = createTestUser({ tenantId: testTenantId(903), roles: ["Admin"] });

    const start = await stack.http.write(ReadinessWrites.runProbes, {}, admin);
    const read = await stack.http.query(ReadinessQueries.latestResults, {}, admin);

    expect(start.status).toBe(403);
    expect(read.status).toBe(403);
  });
});
