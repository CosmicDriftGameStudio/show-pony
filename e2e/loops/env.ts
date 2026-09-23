// Single source of truth for the loops config + spec's port/host — kept
// separate from e2e/screenshots/constants.ts so loops stays fully
// decoupled from that suite (separate migration).
export const PORT = Number(process.env["SHOWPONY_LOOPS_PORT"] ?? 4181);
export const APEX_URL = `http://localhost:${PORT}`;

export const publicOrigin = (tenantKey: string): string => `http://${tenantKey}.localhost:${PORT}`;

export const publicEventUrl = (tenantKey: string, slug: string): string =>
  `${publicOrigin(tenantKey)}/e/${slug}`;
