import type { Page, Response } from "@playwright/test";

function hasWriteType(body: unknown): body is { type: string } {
  return typeof body === "object" && body !== null && "type" in body && typeof body.type === "string";
}

export function waitForWrite(page: Page, type: string): Promise<Response> {
  return page.waitForResponse((res) => {
    if (!res.url().includes("/api/write")) return false;
    const body: unknown = res.request().postDataJSON();
    return hasWriteType(body) && body.type === type;
  });
}
