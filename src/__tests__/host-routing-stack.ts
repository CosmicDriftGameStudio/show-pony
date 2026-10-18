// Test mounting of the production host routing: the FW host-routing feature supplies the
// authoritative tenant resolver and the existence check, merged from the registry like
// runProdApp does it.

import {
  createAuthFoundationFeature,
  resolveAnonymousAccessFromRegistry,
} from "@cosmicdrift/kumiko-bundled-features/auth-foundation";
import { createHostRoutingFeature } from "@cosmicdrift/kumiko-bundled-features/host-routing";
import type { FeatureDefinition } from "@cosmicdrift/kumiko-framework/engine";
import type { setupAppTestStack } from "@cosmicdrift/kumiko-testing";
import { showPonyHostRoutingOptions } from "../run-config";

export function hostRoutingFeatures(baseDomain: string): FeatureDefinition[] {
  return [
    createAuthFoundationFeature(),
    createHostRoutingFeature(showPonyHostRoutingOptions(baseDomain)),
  ];
}

type StackOptions = NonNullable<Parameters<typeof setupAppTestStack>[1]>;

export const hostRoutingAnonymousAccess = {
  anonymousAccess: () => ({}),
  enrichAnonymousAccess: (base, deps) => resolveAnonymousAccessFromRegistry(base, deps),
} satisfies Pick<StackOptions, "anonymousAccess" | "enrichAnonymousAccess">;
