export const PORT = Number(process.env.SHOWPONY_E2E_PORT ?? 4181);
export const BASE_DOMAIN = "show-pony.localhost";
export const APEX_URL = `http://${BASE_DOMAIN}:${PORT}`;
export const DEMO_SLUG = "rooftop-launch";
export const ACME_SLUG = "acme-offsite";
export const publicEventUrl = (slug: string): string =>
  `http://demo.${BASE_DOMAIN}:${PORT}/e/${slug}`;
export const acmePublicEventUrl = (slug: string): string =>
  `http://acme.${BASE_DOMAIN}:${PORT}/e/${slug}`;
export const STORAGE_STATE = "e2e/screenshots/.auth/state.json";

