// Live-demo mode: cloud instance is browse-only; local dev stays writable.

export type DemoAccountRole = "host" | "sysadmin";

export type DemoAccount = {
  readonly role: DemoAccountRole;
  readonly label: { readonly de: string; readonly en: string };
  readonly email: string;
  readonly password: string;
};

export type DemoModePayload = {
  readonly readOnly: boolean;
  readonly accounts: readonly DemoAccount[];
  readonly hostLoginUrl: string;
  readonly tutorialUrl: string;
};

export function isDemoReadOnly(env: Record<string, string | undefined> = process.env): boolean {
  return env.DEMO_READ_ONLY === "true" || env.DEMO_READ_ONLY === "1";
}

export function demoModePayload(
  env: Record<string, string | undefined> = process.env,
  defaultPort: number,
): DemoModePayload {
  const baseDomain = env.BASE_DOMAIN ?? "show-pony.localhost";
  const hostLoginUrl = baseDomain.includes("localhost")
    ? `http://${baseDomain}:${env.PORT ?? String(defaultPort)}`
    : `https://${baseDomain}`;
  const readOnly = isDemoReadOnly(env);
  const accounts: DemoAccount[] = [];
  if (readOnly) {
    const hostEmail = env.DEMO_ADMIN_EMAIL;
    const hostPassword = env.DEMO_ADMIN_PASSWORD;
    const sysEmail = env.DEMO_SYSADMIN_EMAIL;
    const sysPassword = env.DEMO_SYSADMIN_PASSWORD;
    if (hostEmail && hostPassword) {
      accounts.push({
        role: "host",
        label: { de: "Host (Events-Workspace)", en: "Host (Events workspace)" },
        email: hostEmail,
        password: hostPassword,
      });
    }
    // Exposes sysadmin credentials to any anonymous visitor of a read-only
    // public demo — deliberate: writes are blocked read-only regardless of
    // role (withDemoReadOnlyFetch), so the only extra exposure is anonymous
    // cross-tenant READS. Kept for the tutorial's "here's what a platform
    // admin sees" walkthrough; drop this block if that stops being worth it.
    if (sysEmail && sysPassword) {
      accounts.push({
        role: "sysadmin",
        label: { de: "Plattform (Sysadmin)", en: "Platform (sysadmin)" },
        email: sysEmail,
        password: sysPassword,
      });
    }
  }
  return {
    readOnly,
    accounts,
    hostLoginUrl,
    tutorialUrl: "https://docs.kumiko.rocks/en/show-pony/",
  };
}

// Deny-by-default: every mutating request is blocked unless explicitly
// allowlisted below. A per-path Set (as this used to be) only covers paths
// someone remembered to add — auth/invite/switch-tenant routes mounted by
// the framework after this guard was written slipped through that way.
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ALLOWED_MUTATING_PATHS = new Set([
  "/api/query",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/mfa/verify",
]);

/** Blocks data writes on the live demo; auth routes stay open. */
export function withDemoReadOnlyFetch(
  fetchHandler: (req: Request) => Response | Promise<Response>,
  env: Record<string, string | undefined> = process.env,
): (req: Request) => Response | Promise<Response> {
  if (!isDemoReadOnly(env)) return fetchHandler;
  return async (req: Request) => {
    const url = new URL(req.url);
    if (MUTATING_METHODS.has(req.method) && !ALLOWED_MUTATING_PATHS.has(url.pathname)) {
      return Response.json(
        {
          isSuccess: false,
          error: {
            code: "demo_read_only",
            message: "This live demo is read-only. Clone the repo locally to build your own.",
            i18nKey: "showpony:demo.read-only.error",
          },
        },
        { status: 403 },
      );
    }
    return fetchHandler(req);
  };
}
