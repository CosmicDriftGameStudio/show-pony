import type { CapSpec } from "@cosmicdrift/kumiko-bundled-features/cap-overview";
import { eventTable } from "./schema/event";
import { rsvpTable } from "./schema/rsvp";
import { capsForTier } from "./tier-map";

export const ShowPonyCapIds = { events: "events", guests: "guests" } as const;

function limitOrUnlimited(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

// usage runs against an unfiltered system DB (cap-overview), so every count needs an explicit { tenantId }.
export const SHOWPONY_CAP_SPECS = [
  {
    id: ShowPonyCapIds.events,
    label: "showpony:caps.events",
    icon: "hash",
    unit: "count",
    limit: (tier) => limitOrUnlimited(capsForTier(tier).maxEvents),
    usage: (db, tenantId) => db.count(eventTable, { tenantId }),
  },
  {
    id: ShowPonyCapIds.guests,
    label: "showpony:caps.guests",
    icon: "users",
    unit: "count",
    limit: (tier) => limitOrUnlimited(capsForTier(tier).maxGuests),
    usage: (db, tenantId) => db.count(rsvpTable, { tenantId }),
  },
] as const satisfies readonly CapSpec[];
