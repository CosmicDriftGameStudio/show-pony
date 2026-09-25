// Registered port: kumiko-framework/samples/e2e/e2e-ports.ts (show-pony/screenshots: 4193,
// distinct from show-pony/e2e: 4181 used by e2e/loops). BASE_DOMAIN is set to "localhost"
// on the config's webServer env, so every seeded tenant resolves at <tenant.key>.localhost.
export const PORT = Number(process.env["SHOWPONY_SCREENSHOTS_PORT"] ?? 4193);
export const APEX_URL = `http://localhost:${PORT}`;

export const publicOrigin = (tenantKey: string): string => `http://${tenantKey}.localhost:${PORT}`;

export const publicEventUrl = (tenantKey: string, slug: string): string =>
  `${publicOrigin(tenantKey)}/e/${slug}`;
