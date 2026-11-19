import { z } from "zod";
import { RSVP_STATUSES } from "./rsvp";

export const rsvpSubmitSchema = z.object({
  eventId: z.uuid(),
  name: z.string().min(1).max(120),
  // Lowercased so the duplicate check and the stored address agree on one spelling.
  email: z.email().toLowerCase().optional(),
  status: z.enum(RSVP_STATUSES),
  plusN: z.number().int().min(0).max(20).default(0),
  note: z.string().max(500).optional(),
});

export type RsvpSubmitPayload = z.infer<typeof rsvpSubmitSchema>;
