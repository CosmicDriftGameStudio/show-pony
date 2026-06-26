// Browser-API für die public Event-Page. Anonymer Pfad: kein Token, keine
// Auth-Cookie — der CSRF-Guard im Framework überspringt anonyme Requests.
// Der Tenant kommt server-seitig aus der Subdomain (Host-Header), nicht aus
// dem Payload.

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
    body: JSON.stringify({ type: "showpony:query:event:bySlug", payload: { slug } }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data: PublicEvent | null };
  return body.data;
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
