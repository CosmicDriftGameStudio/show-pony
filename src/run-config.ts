// Single source of truth for show-pony feature composition.
// Both bin/server.ts (dev) and the kumiko-schema CLI build on this,
// so the runtime registry and generated schema never drift apart.
//
// HAS_AUTH=true → composeFeatures automatically pulls in the bundled auth chain
// (config/user/tenant/auth-email-password/secrets).
//
// mail-foundation + a transport for guest confirmation emails. In the sample,
// the inmemory transport (inbox via getInbox); switching to a real SMTP transport
// is a deploy-time swap (mail-transport-smtp), not a code change.

import { createAdminShellFeature } from "@cosmicdrift/kumiko-bundled-features/admin-shell";
import { createAuditFeature } from "@cosmicdrift/kumiko-bundled-features/audit";
import { createJobsFeature } from "@cosmicdrift/kumiko-bundled-features/jobs";
import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { mailTransportInMemoryFeature } from "@cosmicdrift/kumiko-bundled-features/mail-transport-inmemory";
import { createRateLimitingFeature } from "@cosmicdrift/kumiko-bundled-features/rate-limiting";
import { appShellFeature } from "./features/app-shell/feature";
import { showPonyFeature } from "./features/show-pony/feature";

/** Overview screens + nav only — app-shell owns workspaces host/platform. */
const adminShellFeature = createAdminShellFeature({
  registerWorkspaces: false,
  includeTierAdmin: false,
});

// rsvp:submit is an anonymous write, so it MUST declare a rateLimit (all anon
// callers share user.id="anonymous"). That needs a RateLimitResolver wired —
// dev/test provide a default, but runProdApp doesn't, so the seed's
// rsvp:submit crashed at boot. Loading this feature wires the resolver.
export const APP_FEATURES = [
  mailFoundationFeature,
  mailTransportInMemoryFeature,
  createRateLimitingFeature(),
  createAuditFeature(),
  createJobsFeature(),
  adminShellFeature,
  appShellFeature,
  showPonyFeature,
] as const;

export const HAS_AUTH = true;
