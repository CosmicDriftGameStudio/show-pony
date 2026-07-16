// Browser API for the public event page. Anonymous path: no token, no
// auth cookie — the framework's CSRF guard skips anonymous requests.
// The tenant is resolved server-side from the subdomain (Host header), not
// from the payload.

import {
  coerceInviteBranding,
  type InviteBranding,
} from "../features/show-pony/invite-branding.shared";

export type PublicEvent = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly startsAt: string;
  readonly location: string;
  readonly description: string;
  readonly guestLimit: number;
};

export type RsvpStatus = "yes" | "no" | "maybe";

export type RsvpInput = {
  readonly eventId: string;
  readonly name: string;
  readonly status: RsvpStatus;
  readonly plusN: number;
  readonly email?: string;
  readonly note?: string;
};

export async function fetchEventBySlug(slug: string): Promise<PublicEvent | null> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "showpony:query:event:by-slug", payload: { slug } }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data: PublicEvent | null };
  return body.data;
}

export async function fetchInviteBranding(): Promise<InviteBranding> {
  // Branding is non-essential: never let a network/parse failure here
  // reject the Promise.all in EventPage and hide an event that DID load.
  try {
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "showpony:query:invite-branding", payload: {} }),
    });
    if (!res.ok) return coerceInviteBranding(null);
    const body = (await res.json()) as { data: unknown };
    return coerceInviteBranding(body.data);
  } catch {
    return coerceInviteBranding(null);
  }
}

export type SubmitResult = { ok: true } | { ok: false; reason: string };

export async function submitRsvp(input: RsvpInput): Promise<SubmitResult> {
  const res = await fetch("/api/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "showpony:write:rsvp:submit", payload: input }),
  });
  if (!res.ok) return { ok: false, reason: `submit failed: ${res.status}` };
  const body = (await res.json()) as
    | { isSuccess: true }
    | { isSuccess: false; error: { code: string } };
  return body.isSuccess ? { ok: true } : { ok: false, reason: body.error.code };
}
