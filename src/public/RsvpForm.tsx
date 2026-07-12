// The RSVP form — the anonymous write from the public page. Name is required,
// email optional. Inline success on submit, no redirect.

import { useTranslation } from "@cosmicdrift/kumiko-renderer";
import { type FormEvent, type ReactElement, useState } from "react";
import { type RsvpStatus, submitRsvp } from "./api";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; name: string }
  | { kind: "error"; reason: string };

export function RsvpForm({ eventId }: { readonly eventId: string }): ReactElement {
  const t = useTranslation();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<RsvpStatus>("yes");
  const [plusN, setPlusN] = useState(0);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({ kind: "idle" });

  const statusLabels: Record<RsvpStatus, string> = {
    yes: t("showpony:public.rsvp.status.yes"),
    maybe: t("showpony:public.rsvp.status.maybe"),
    no: t("showpony:public.rsvp.status.no"),
  };

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
        <strong>{t("showpony:public.rsvp.thanks", { name: state.name })}</strong>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          {t("showpony:public.rsvp.on-list")}
        </p>
      </div>
    );
  }

  const field =
    "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4"
    >
      <div className="grid gap-3">
        <input
          aria-label={t("showpony:public.rsvp.name")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("showpony:public.rsvp.name-placeholder")}
          className={field}
        />
        <div className="flex gap-2">
          {(Object.keys(statusLabels) as RsvpStatus[]).map((s) => (
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
              {statusLabels[s]}
            </button>
          ))}
        </div>
        <label className="text-sm text-[var(--color-muted-foreground)]">
          {t("showpony:public.rsvp.plus-guests")}
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
          aria-label={t("showpony:public.rsvp.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("showpony:public.rsvp.email-placeholder")}
          className={field}
        />
        <button
          type="submit"
          disabled={state.kind === "submitting" || name.length === 0}
          className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] disabled:opacity-50"
        >
          {state.kind === "submitting" ? "…" : t("showpony:public.rsvp.submit")}
        </button>
        {state.kind === "error" && (
          <p className="text-sm text-[var(--color-destructive)]">
            {t("showpony:public.rsvp.error", { reason: state.reason })}
          </p>
        )}
      </div>
    </form>
  );
}

