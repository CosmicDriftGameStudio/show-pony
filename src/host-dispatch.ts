// Host → page routing. The apex marketing matrix (per-locale pages, legacy /en redirects)
// is app-owned because the FW apex surface knows one file per locale; everything else
// (host surface, guest pages, unknown tenants) is the FW host-routing decision.

import {
  createHostDispatch,
  normalizeHostname,
} from "@cosmicdrift/kumiko-bundled-features/host-routing";
import { toDevHostDispatch } from "@cosmicdrift/kumiko-dev-server";
import type { RunProdAppOptions } from "@cosmicdrift/kumiko-server-runtime";
import {
  dispatchShowPonyApexStatic,
  dispatchShowPonyApexStaticDev,
} from "./marketing/locale-routes";
import { showPonyHostRoutingOptions } from "./run-config";

type HostDispatchFn = NonNullable<RunProdAppOptions["hostDispatch"]>;
type DevHostDispatch = ReturnType<typeof toDevHostDispatch>;

function isApexHost(host: string, baseDomain: string): boolean {
  const hostname = normalizeHostname(host);
  return hostname === baseDomain || hostname === `www.${baseDomain}`;
}

export function createShowPonyHostDispatch(baseDomain: string): HostDispatchFn {
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
  const routed = toDevHostDispatch(createHostDispatch(showPonyHostRoutingOptions(baseDomain)), {
    entries: { "admin.html": "admin", "index.html": "public" },
    staticDir: "./dist",
  });
  return async (req, deps) => {
    if (isApexHost(req.headers.get("host") ?? "", baseDomain)) {
      const marketing = dispatchShowPonyApexStaticDev(new URL(req.url).pathname);
      if (marketing !== null) return marketing;
    }
    return routed(req, deps);
  };
}
