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
): DemoModePayload {
  const baseDomain = env.BASE_DOMAIN ?? "show-pony.localhost";
  const hostLoginUrl = baseDomain.includes("localhost")
    ? `http://${baseDomain}:${env.PORT ?? "4180"}`
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

const WRITE_PATHS = new Set(["/api/write", "/api/batch"]);

/** Blocks data writes on the live demo; auth routes stay open. */
export function withDemoReadOnlyFetch(
  fetchHandler: (req: Request) => Response | Promise<Response>,
  env: Record<string, string | undefined> = process.env,
): (req: Request) => Response | Promise<Response> {
  if (!isDemoReadOnly(env)) return fetchHandler;
  return async (req: Request) => {
    const url = new URL(req.url);
    if (req.method === "POST" && WRITE_PATHS.has(url.pathname)) {
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
