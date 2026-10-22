// Delivery wiring that showPonyFeature requires (RSVP confirmation mail goes through
// ctx.notify). Guests are addressed by typed email, so no user lookup exists.

import {
  createChannelEmailFeature,
  type EmailTransport,
} from "@cosmicdrift/kumiko-bundled-features/channel-email";
import { createDeliveryFeature } from "@cosmicdrift/kumiko-bundled-features/delivery";
import { composeRendererStack } from "@cosmicdrift/kumiko-dev-server/compose-stacks";
import type { FeatureDefinition } from "@cosmicdrift/kumiko-framework/engine";

export function deliveryFeatures(transport: EmailTransport): FeatureDefinition[] {
  return [
    ...composeRendererStack(),
    createDeliveryFeature(),
    createChannelEmailFeature({ transport, resolveEmail: async () => null }),
  ];
}
