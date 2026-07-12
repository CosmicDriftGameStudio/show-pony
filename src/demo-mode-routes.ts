import type { Hono } from "hono";
import { demoModePayload } from "./demo-mode";

export function wireDemoModeRoutes(app: Hono): void {
  // Outside /api/* so auth middleware does not require a tenant (PUBLIC_API_PATHS
  // is framework-owned; demo-mode is app-specific).
  app.get("/demo-mode", (c) => c.json(demoModePayload()));
}
