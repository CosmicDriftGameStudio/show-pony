import { describe, expect, test } from "bun:test";
import { eventBySlugQuery } from "../features/show-pony/handlers/event-by-slug.query";
import { inviteBrandingQuery } from "../features/show-pony/handlers/invite-branding.query";

describe("anonymous handlers rate-limit by IP", () => {
  test.each([
    ["event:by-slug", eventBySlugQuery],
    ["invite-branding", inviteBrandingQuery],
  ])("%s buckets on IP, not on the shared anonymous user id", (_name, handler) => {
    expect(handler.rateLimit).toEqual({ per: "ip", limit: 60, windowSeconds: 60 });
  });
});
