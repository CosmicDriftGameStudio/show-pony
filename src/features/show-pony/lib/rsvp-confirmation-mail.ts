import { createTransportForTenant } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { escapeHtml } from "@cosmicdrift/kumiko-headless";
import type { HandlerContext, TenantId } from "@cosmicdrift/kumiko-framework/engine";
import type { z } from "zod";
import { eventTable } from "../schema/event";
import type { RsvpStatus } from "../schema/rsvp";
import type { rsvpSubmitSchema } from "../handlers/rsvp-submit.write";

const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  yes: "Coming",
  no: "Not coming",
  maybe: "Maybe",
};

// Best-effort confirmation mail to the guest (only when they gave an email).
// mail-foundation DIRECTLY, not delivery: delivery is user-centric
// (recipient = userId → email lookup), and our guest is anonymous, addressable
// only by the email they just typed — the low-level transport is the fit.
export async function sendRsvpConfirmation(
  ctx: HandlerContext,
  tenantId: TenantId,
  payload: z.infer<typeof rsvpSubmitSchema>,
): Promise<void> {
  if (!payload.email) return;
  const events = await ctx.db.selectMany(eventTable);
  const found = events.find((e) => e.id === payload.eventId)?.title;
  const title = typeof found === "string" ? found : "your event";
  const transport = await createTransportForTenant(ctx, tenantId, "showpony:write:rsvp:submit");
  await transport.send({
    to: payload.email,
    subject: `Your RSVP for "${title}"`,
    html:
      `<p>Hi ${escapeHtml(payload.name)},</p>` +
      `<p>your reply (<strong>${RSVP_STATUS_LABELS[payload.status]}</strong>) for ` +
      `"${escapeHtml(title)}" is in. Thanks!</p>`,
  });
}
