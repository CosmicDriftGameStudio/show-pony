export const PORT = Number(process.env.SHOWPONY_E2E_PORT ?? 4181);
export const BASE_DOMAIN = "show-pony.localhost";
// Must match DEMO_TENANT_ID in bin/server.ts — the authed seed
// sets X-Tenant explicitly (raw fetch, no SPA tenant switcher).
export const DEMO_TENANT_ID = "00000000-0000-4000-8000-0000000000a1";
export const ACME_TENANT_ID = "00000000-0000-4000-8000-0000000000a2";
export const APEX_URL = `http://${BASE_DOMAIN}:${PORT}`;
export const DEMO_SLUG = "rooftop-launch";
export const ACME_SLUG = "acme-offsite";
export const publicEventUrl = (slug: string): string =>
  `http://demo.${BASE_DOMAIN}:${PORT}/e/${slug}`;
export const acmePublicEventUrl = (slug: string): string =>
  `http://acme.${BASE_DOMAIN}:${PORT}/e/${slug}`;
export const STORAGE_STATE = "e2e/screenshots/.auth/state.json";

