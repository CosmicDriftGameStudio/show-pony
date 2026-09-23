// writeOk dispatches the same handler as the UI through /api/write, so a
// seeded row's id is available immediately.
import type { E2eSeededTenant } from "@cosmicdrift/kumiko-testing/e2e";

type SeedEventOverrides = Partial<{
  title: string;
  slug: string;
  startsAt: string;
  location: string;
  guestLimit: number;
}>;

export async function seedLoopEvent(
  api: ReturnType<E2eSeededTenant["apiAs"]>,
  overrides: SeedEventOverrides = {},
): Promise<{ id: string; slug: string }> {
  const slug = overrides.slug ?? "rooftop-launch";
  const created = await api.writeOk<{ id: string }>("showpony:write:event:create", {
    title: "Rooftop Launch Party",
    slug,
    startsAt: "2026-09-12T19:00:00.000Z",
    location: "Sky Lounge, 24th floor",
    guestLimit: 80,
    ...overrides,
  });
  return { id: created.id, slug };
}

type LoopGuest = {
  eventId: string;
  name: string;
  status: "yes" | "no" | "maybe";
  plusN?: number;
  email?: string;
  note?: string;
};

// rsvp:submit is anonymous + rate-limited (20/60s per ip+handler) — plain
// unauthenticated POST, no session/CSRF needed (see access.anonymous in
// src/features/show-pony/handlers/rsvp-submit.write.ts). Do NOT use
// tenant.api/tenant.apiAs here — that's the admin session, a real guest never has one.
export async function seedLoopGuest(publicOrigin: string, guest: LoopGuest): Promise<void> {
  const res = await fetch(`${publicOrigin}/api/write`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "showpony:write:rsvp:submit", payload: guest }),
  });
  if (!res.ok) throw new Error(`seedLoopGuest: ${res.status} ${await res.text()}`);
}
