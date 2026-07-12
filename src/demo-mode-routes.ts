import type { Hono } from "hono";
import { demoModePayload } from "./demo-mode";

export function wireDemoModeRoutes(app: Hono): void {
  app.get("/api/demo-mode", (c) => c.json(demoModePayload()));
  app.get("/api/version", (c) => c.json({ version: process.env.BUILD_VERSION ?? "dev" }));
}
