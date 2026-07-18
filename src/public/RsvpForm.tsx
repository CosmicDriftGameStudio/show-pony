// The RSVP form — the anonymous write from the public page. Name is required,
// email optional. Inline success on submit, no redirect.

import { usePrimitives, useTranslation } from "@cosmicdrift/kumiko-renderer";
import { ModeSwitch } from "@cosmicdrift/kumiko-renderer-web";
import { type ReactElement, useState } from "react";
import { type RsvpStatus, submitRsvp } from "./api";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; name: string }
  | { kind: "error"; reason: string };

export function RsvpForm({ eventId }: { readonly eventId: string }): ReactElement {
  const t = useTranslation();
  const { Banner, Button, Field, Form, Input } = usePrimitives();
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

  async function onSubmit(): Promise<void> {
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
      <div className="sp-rsvp-success mt-6 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-card)] p-5 text-sm">
        <div className="flex items-start gap-3">
          <span
            className="sp-rsvp-check flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg text-[var(--color-primary-foreground)]"
            aria-hidden
          >
            ✓
          </span>
          <div>
            <strong className="text-base">
              {t("showpony:public.rsvp.thanks", { name: state.name })}
            </strong>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              {t("showpony:public.rsvp.on-list")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Form
        onSubmit={(e) => {
          e?.preventDefault();
          void onSubmit();
        }}
      >
        <Field id="rsvp-name" label={t("showpony:public.rsvp.name")} required>
          <Input
            kind="text"
            id="rsvp-name"
            name="rsvp-name"
            value={name}
            onChange={setName}
            placeholder={t("showpony:public.rsvp.name-placeholder")}
            required
            disabled={state.kind === "submitting"}
          />
        </Field>
        <ModeSwitch
          value={status}
          onChange={setStatus}
          options={(Object.keys(statusLabels) as RsvpStatus[]).map((s) => ({
            value: s,
            label: statusLabels[s],
          }))}
        />
        <Field id="rsvp-plus-n" label={t("showpony:public.rsvp.plus-guests")}>
          <Input
            kind="number"
            id="rsvp-plus-n"
            name="rsvp-plus-n"
            value={plusN}
            onChange={(v) => setPlusN(Math.min(20, Math.max(0, v ?? 0)))}
            disabled={state.kind === "submitting"}
          />
        </Field>
        <Field id="rsvp-email" label={t("showpony:public.rsvp.email")}>
          <Input
            kind="email"
            id="rsvp-email"
            name="rsvp-email"
            value={email}
            onChange={setEmail}
            placeholder={t("showpony:public.rsvp.email-placeholder")}
            disabled={state.kind === "submitting"}
          />
        </Field>
        {state.kind === "error" && (
          <Banner variant="error">
            {t("showpony:public.rsvp.error", { reason: state.reason })}
          </Banner>
        )}
        <Button type="submit" loading={state.kind === "submitting"} disabled={name.length === 0}>
          {t("showpony:public.rsvp.submit")}
        </Button>
      </Form>
    </div>
  );
}
