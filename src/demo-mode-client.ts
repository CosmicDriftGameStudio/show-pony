// Client-side demo-mode fetch (public + admin bundles).

import type { DemoModePayload } from "./demo-mode";

let cached: DemoModePayload | null = null;
let inflight: Promise<DemoModePayload> | null = null;

export async function fetchDemoMode(): Promise<DemoModePayload> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = fetch("/api/demo-mode")
    .then((res) => res.json() as Promise<DemoModePayload>)
    .then((payload) => {
      cached = payload;
      return payload;
    })
    .catch(() => {
      const fallback: DemoModePayload = {
        readOnly: false,
        accounts: [],
        hostLoginUrl: "",
        tutorialUrl: "https://docs.kumiko.rocks/en/show-pony/",
      };
      cached = fallback;
      return fallback;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
