// Composable seed helpers shared by the screenshot scenarios and
// e2e/verify-invite-stack.spec.ts. Each helper writes through a tenant-bound
// BoundApi (tenant.apiAs(host)) rather than the UI, matching e2e/loops' seed
// pattern — no shared login/seed state between scenarios or specs.
import { BRANDING_QN } from "@cosmicdrift/kumiko-bundled-features/managed-pages";
import type { E2eSeededTenant } from "@cosmicdrift/kumiko-testing/e2e";
import { INVITE_BRANDING_QN } from "../../src/features/show-pony/invite-branding.shared";
import { publicOrigin } from "./constants";

export type Api = ReturnType<E2eSeededTenant["apiAs"]>;

export const DEMO_SLUG = "rooftop-launch";
export const ACME_SLUG = "acme-offsite";

async function setConfig(api: Api, key: string, value: string): Promise<void> {
  await api.writeOk("config:write:set", { key, value });
}

export async function seedDemoBranding(api: Api): Promise<void> {
  await setConfig(api, BRANDING_QN.title, "Mira Events");
  await setConfig(api, BRANDING_QN.description, "✨ Rooftop invites with sparkle ✨");
  await setConfig(api, BRANDING_QN.accentColor, "#7c3aed");
  await setConfig(api, INVITE_BRANDING_QN.heroImageUrl, "/heroes/demo-rooftop.webp");
  await setConfig(api, INVITE_BRANDING_QN.heroStyle, "immersive");
}

export async function seedAcmeBranding(api: Api): Promise<void> {
  await setConfig(api, BRANDING_QN.title, "Acme Studios");
  await setConfig(api, BRANDING_QN.description, "Clean design. Loud ideas. \u{1F3A8}");
  await setConfig(api, BRANDING_QN.accentColor, "#0d9488");
  await setConfig(api, INVITE_BRANDING_QN.heroImageUrl, "/heroes/acme-studio.webp");
  await setConfig(api, INVITE_BRANDING_QN.heroStyle, "split");
}

export const ROOFTOP_DESCRIPTION =
  "✨ You're on the list for something special.\n\n" +
  "Join us on the 24th floor — cocktails, live DJ, and the Show Pony 2.0 launch at midnight \u{1F389}\n\n" +
  "Dress code: rooftop-ready \u{1F460}\n" +
  "Bring someone you'd proudly introduce to the team \u{1F49C}";

export const OFFSITE_DESCRIPTION =
  "\u{1F3A8} Team offsite season is here!\n\n" +
  "Workshops in the morning, pizza on the studio floor, and zero mandatory fun runs \u{1F605}\n\n" +
  "RSVP so we know how many chairs (and how much coffee) to order ☕️";

type CreatedEvent = { readonly id: string; readonly slug: string };

export async function seedRooftopEvent(api: Api): Promise<CreatedEvent> {
  const created = await api.writeOk<{ id: string }>("showpony:write:event:create", {
    title: "Rooftop Launch Party",
    slug: DEMO_SLUG,
    startsAt: "2026-09-12T19:00:00.000Z",
    location: "Sky Lounge, 24th floor",
    description: ROOFTOP_DESCRIPTION,
    guestLimit: 80,
  });
  return { id: created.id, slug: DEMO_SLUG };
}

export async function seedOffsiteEvent(api: Api): Promise<CreatedEvent> {
  const created = await api.writeOk<{ id: string }>("showpony:write:event:create", {
    title: "Acme Offsite RSVP",
    slug: ACME_SLUG,
    startsAt: "2026-10-03T18:00:00.000Z",
    location: "Acme HQ — Studio floor",
    description: OFFSITE_DESCRIPTION,
    guestLimit: 60,
  });
  return { id: created.id, slug: ACME_SLUG };
}

type RsvpStatus = "yes" | "no" | "maybe";
const ROOFTOP_GUESTS: ReadonlyArray<{
  readonly name: string;
  readonly status: RsvpStatus;
  readonly plusN: number;
}> = [
  { name: "Ava Chen", status: "yes", plusN: 2 },
  { name: "Marcus Bell", status: "yes", plusN: 0 },
  { name: "Priya Raman", status: "maybe", plusN: 1 },
  { name: "Diego Santos", status: "no", plusN: 0 },
];

// Anonymous, like the public RSVP form — event handlers gate writes on tenant
// membership, but rsvp:submit is a public write resolved from the Host header.
export async function seedRooftopGuests(tenantKey: string, eventId: string): Promise<void> {
  for (const guest of ROOFTOP_GUESTS) {
    const response = await fetch(`${publicOrigin(tenantKey)}/api/write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "showpony:write:rsvp:submit",
        payload: { eventId, ...guest },
      }),
    });
    if (!response.ok) {
      throw new Error(`seedRooftopGuests: ${response.status} ${await response.text()}`);
    }
  }
}
