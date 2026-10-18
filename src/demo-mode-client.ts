// Client-side demo-mode fetch (public + admin bundles).

import { type DemoModePayload, TUTORIAL_LINK_LABEL, TUTORIAL_URL } from "./demo-mode-notice";

let cached: DemoModePayload | null = null;
let inflight: Promise<DemoModePayload> | null = null;

// Dev has no demoMode option, so GET /demo-mode 404s there: not read-only, but the tutorial link stays.
const FALLBACK: DemoModePayload = {
  readOnly: false,
  notice: { links: [{ label: TUTORIAL_LINK_LABEL, href: TUTORIAL_URL }], accounts: [] },
};

export async function fetchDemoMode(): Promise<DemoModePayload> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = fetch("/demo-mode")
    .then((res) => (res.ok ? (res.json() as Promise<DemoModePayload>) : FALLBACK))
    .then((payload) => {
      cached = payload;
      return payload;
    })
    .catch(() => FALLBACK)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
