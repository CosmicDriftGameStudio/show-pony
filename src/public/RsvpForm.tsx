// The RSVP form — the anonymous write from the public page. Name is required,
// email optional. Inline success on submit, no redirect.

import { type FormEvent, type ReactElement, useState } from "react";
import { type RsvpStatus, submitRsvp } from "./api";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; name: string }
  | { kind: "error"; reason: string };

const STATUS_LABELS: Record<RsvpStatus, string> = {
  yes: "I'm in",
  maybe: "Maybe",
  no: "Can't make it",
};

export function RsvpForm({ eventId }: { readonly eventId: string }): ReactElement {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<RsvpStatus>("yes");
  const [plusN, setPlusN] = useState(0);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (name.length === 0) return;
    setState({ kind: "submitting" });
    const result = await submitRsvp({
      eventId,
      name,
      status,
      plusN,
      ...(email.length > 0 ? { email } : {}),
    });
    setState(result.ok ? { kind: "success", name } : { kind: "error", reason: result.reason });
  }

  if (state.kind === "success") {
    return (
      <div className="mt-6 rounded-md border border-[var(--color-primary)] bg-[var(--color-card)] p-4 text-sm">
        <strong>Thanks, {state.name}!</strong>
        <p className="mt-1 text-[var(--color-muted-foreground)]">You're on the list.</p>
      </div>
    );
  }

  const field =
    "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4"
    >
      <div className="grid gap-3">
        <input
          aria-label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={field}
        />
        <div className="flex gap-2">
          {(Object.keys(STATUS_LABELS) as RsvpStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                status === s
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "border-[var(--color-border)] bg-[var(--color-background)]"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <label className="text-sm text-[var(--color-muted-foreground)]">
          Bringing anyone?
          <input
            type="number"
            min={0}
            max={20}
            value={plusN}
            onChange={(e) => setPlusN(Number.parseInt(e.target.value, 10) || 0)}
            className={`${field} mt-1`}
          />
        </label>
        <input
          aria-label="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional, for your confirmation)"
          className={field}
        />
        <button
          type="submit"
          disabled={state.kind === "submitting" || name.length === 0}
          className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] disabled:opacity-50"
        >
          {state.kind === "submitting" ? "…" : "Send RSVP"}
        </button>
        {state.kind === "error" && (
          <p className="text-sm text-[var(--color-destructive)]">
            Something went wrong ({state.reason}). Try again.
          </p>
        )}
      </div>
    </form>
  );
}
