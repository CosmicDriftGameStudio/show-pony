// Host → page routing. The apex marketing matrix (per-locale pages, legacy /en redirects)
// is app-owned because the FW apex surface knows one file per locale; everything else
// (host surface, guest pages, unknown tenants) is the FW host-routing decision.

import {
  createHostDispatch,
  type HostRoutingDispatchFn,
  normalizeHostname,
} from "@cosmicdrift/kumiko-bundled-features/host-routing";
import { toDevHostDispatch } from "@cosmicdrift/kumiko-dev-server";
import { dispatchShowPonyApexStatic } from "./marketing/locale-routes";
import { showPonyHostRoutingOptions } from "./tenant-routing";

type DevHostDispatch = ReturnType<typeof toDevHostDispatch>;

function isApexHost(host: string, baseDomain: string): boolean {
  const hostname = normalizeHostname(host);
  return hostname === baseDomain || hostname === `www.${baseDomain}`;
}

export function createShowPonyHostDispatch(baseDomain: string): HostRoutingDispatchFn {
  const routed = createHostDispatch(showPonyHostRoutingOptions(baseDomain));
  return async (req, deps) => {
    if (isApexHost(req.host, baseDomain)) {
      const marketing = dispatchShowPonyApexStatic(req.path);
      if (marketing !== null) return marketing;
    }
    return routed(req, deps);
  };
}

export function createShowPonyDevHostDispatch(baseDomain: string): DevHostDispatch {
  return toDevHostDispatch(createShowPonyHostDispatch(baseDomain), {
    entries: { "admin.html": "admin", "index.html": "public" },
    staticDir: "./dist",
  });
}
