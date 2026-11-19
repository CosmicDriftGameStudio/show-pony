// Loops spec host/port helpers — kept separate from e2e/screenshots/constants.ts so
// loops stays fully decoupled from that suite. The port is the one playwright.config.ts boots.
import appConfig from "../../kumiko.config";

export const PORT = appConfig.ports.e2e;
export const APEX_URL = `http://localhost:${PORT}`;

export const publicOrigin = (tenantKey: string): string => `http://${tenantKey}.localhost:${PORT}`;

export const publicEventUrl = (tenantKey: string, slug: string): string =>
  `${publicOrigin(tenantKey)}/e/${slug}`;
