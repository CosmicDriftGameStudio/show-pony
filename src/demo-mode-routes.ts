import type { ExtraRouteDefinition } from "@cosmicdrift/kumiko-framework/api";
import { demoModePayload } from "./demo-mode";

export function buildDemoModeRoutes(defaultPort: number): readonly ExtraRouteDefinition[] {
  return [
    {
      // Outside /api/* so auth middleware does not require a tenant
      // (PUBLIC_API_PATHS is framework-owned; demo-mode is app-specific).
      method: "GET",
      path: "/demo-mode",
      entry: "anonymous",
      handler: (c) => c.json(demoModePayload(process.env, defaultPort)),
    },
  ];
}
