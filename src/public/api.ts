// Browser API for the public event page. Anonymous path: no token, no
// auth cookie — the framework's CSRF guard skips anonymous requests.
// The tenant is resolved server-side from the subdomain (Host header), not
// from the payload.

import { propertyOf } from "@cosmicdrift/kumiko-types/type-guards";
import {
  coerceInviteBranding,
  type InviteBranding,
} from "../features/show-pony/invite-branding.shared";
import { GUEST_LIMIT_REACHED } from "../features/show-pony/rsvp-errors.shared";

export type PublicEvent = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly startsAt: string;
  readonly location: string;
  readonly description: string;
  readonly guestLimit: number | null;
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

export type SubmitResult = { ok: true } | { ok: false; reason: string; guestListFull?: true };

export async function submitRsvp(input: RsvpInput): Promise<SubmitResult> {
  const res = await fetch("/api/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "showpony:write:rsvp:submit", payload: input }),
  });
  if (!res.ok) {
    const errorBody: unknown = await res.json().catch(() => null);
    const reason = propertyOf(propertyOf(propertyOf(errorBody, "error"), "details"), "reason");
    if (reason === GUEST_LIMIT_REACHED) return { ok: false, reason, guestListFull: true };
    return { ok: false, reason: `submit failed: ${res.status}` };
  }
  const body = (await res.json()) as
    | { isSuccess: true }
    | { isSuccess: false; error: { code: string } };
  return body.isSuccess ? { ok: true } : { ok: false, reason: body.error.code };
}
