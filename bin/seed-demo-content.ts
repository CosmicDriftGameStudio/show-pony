// Demo events + invite branding for local dev (`bun dev` skips seedsDir).
import { createSeedMigrationContext } from "@cosmicdrift/kumiko-framework/es-ops";
import type { TestStack } from "@cosmicdrift/kumiko-dev-server";
import demoEventSeed from "../seeds/2026-06-28-demo-event-rsvps.ts";
import heroWebpSeed from "../seeds/2026-07-14-invite-hero-webp.ts";

export async function seedDemoContent(stack: TestStack): Promise<void> {
  const ctx = createSeedMigrationContext({
    dispatcher: stack.dispatcher,
    dbRunner: stack.db,
  });
  await demoEventSeed.run(ctx);
  await heroWebpSeed.run(ctx);
}
