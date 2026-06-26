// Single source of truth für die Feature-Komposition von show-pony.
// bin/server.ts (dev) und der kumiko-schema CLI bauen beide hierauf auf,
// damit Runtime-Registry und generiertes Schema nie auseinanderdriften.
//
// HAS_AUTH=true → composeFeatures zieht die bundled auth-Kette
// (config/user/tenant/auth-email-password/secrets) automatisch dazu.

import { showPonyFeature } from "./feature";

export const APP_FEATURES = [showPonyFeature] as const;

export const HAS_AUTH = true;
