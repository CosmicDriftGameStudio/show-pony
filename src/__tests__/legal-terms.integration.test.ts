import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createTemplateResolverFeature } from "@cosmicdrift/kumiko-bundled-features/template-resolver";
import { seedLegalContentFromJson } from "@cosmicdrift/kumiko-bundled-features/template-resolver/seeding";
import type { TestStack } from "@cosmicdrift/kumiko-framework/stack";
import { setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { buildTermsRoutes } from "../legal-terms";

let stack: TestStack;

beforeAll(async () => {
  stack = await setupAppTestStack([createTemplateResolverFeature()], {
    extraRoutes: buildTermsRoutes(),
  });
  await seedLegalContentFromJson(stack.db, [
    { slug: "terms", locale: "en", title: "Terms Title EN", content: "Some **bold** terms." },
  ]);
});

afterAll(async () => stack?.cleanup());

async function get(path: string, headers: Record<string, string> = {}): Promise<Response> {
  return await stack.app.fetch(new Request(`http://localhost${path}`, { headers }));
}

describe("GET /legal/terms", () => {
  test("renders the seeded block with title and markdown content", async () => {
    const res = await get("/legal/terms");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("Terms Title EN");
    expect(html).toContain("<strong>bold</strong>");
  });

  test("answers 304 when If-None-Match carries the current etag", async () => {
    const first = await get("/legal/terms");
    const etag = first.headers.get("etag");
    expect(etag).toBeTruthy();
    const second = await get("/legal/terms", { "If-None-Match": etag as string });
    expect(second.status).toBe(304);
  });

  test("returns 404 for a locale without a seeded block", async () => {
    const res = await get("/legal/nutzungsbedingungen");
    expect(res.status).toBe(404);
  });
});
