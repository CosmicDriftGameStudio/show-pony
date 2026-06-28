export const PORT = Number(process.env.SHOWPONY_E2E_PORT ?? 4181);
export const BASE_DOMAIN = "show-pony.localhost";
// Muss mit bin/server.ts DEMO_TENANT_ID übereinstimmen — der authed Seed
// setzt X-Tenant explizit (raw fetch, kein SPA-Tenant-Switcher).
export const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1";
export const APEX_URL = `http://${BASE_DOMAIN}:${PORT}`;
export const DEMO_SLUG = "rooftop-launch";
export const publicEventUrl = (slug: string): string =>
  `http://demo.${BASE_DOMAIN}:${PORT}/e/${slug}`;
export const STORAGE_STATE = "e2e/screenshots/.auth/state.json";
