// Single source of truth für die Feature-Komposition von show-pony.
// bin/server.ts (dev) und der kumiko-schema CLI bauen beide hierauf auf,
// damit Runtime-Registry und generiertes Schema nie auseinanderdriften.
//
// HAS_AUTH=true → composeFeatures zieht die bundled auth-Kette
// (config/user/tenant/auth-email-password/secrets) automatisch dazu.
//
// mail-foundation + ein Transport für die Gast-Confirmation. Im Sample der
// inmemory-Transport (Inbox via getInbox); ein echter SMTP-Transport ist ein
// Deploy-Swap (mail-transport-smtp), kein Code-Change am Feature.

import { mailFoundationFeature } from "@cosmicdrift/kumiko-bundled-features/mail-foundation";
import { mailTransportInMemoryFeature } from "@cosmicdrift/kumiko-bundled-features/mail-transport-inmemory";
import { showPonyFeature } from "./feature";

export const APP_FEATURES = [
  mailFoundationFeature,
  mailTransportInMemoryFeature,
  showPonyFeature,
] as const;

export const HAS_AUTH = true;
