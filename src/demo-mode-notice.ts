// Demo-mode notice shared by bin/main.ts (builds it) and the client bundles (read it back).
// Mirrors the FW `GET /demo-mode` payload; kept local because the client bundles must not
// depend on the server runtime package.

export type DemoAccountRole = "admin" | "sysadmin";

type LocalizedText = Readonly<Record<string, string>>;

export type DemoModePayload = {
  readonly readOnly: boolean;
  readonly notice: {
    readonly text?: LocalizedText;
    readonly links?: readonly { readonly label: LocalizedText; readonly href: string }[];
    readonly accounts: readonly {
      readonly role: DemoAccountRole;
      readonly email: string;
      readonly password: string;
    }[];
  };
};

export const HOST_LOGIN_LINK_LABEL = { de: "Host-Login", en: "Host login" } as const;
export const TUTORIAL_LINK_LABEL = { de: "Tutorial", en: "Tutorial" } as const;
export const TUTORIAL_URL = "https://docs.kumiko.rocks/en/show-pony/";

export function buildDemoNotice(baseDomain: string) {
  return {
    // Publishing the sysadmin login is deliberate: writes are blocked read-only regardless of
    // role, so the only extra exposure is anonymous cross-tenant READS. It backs the
    // tutorial's "here's what a platform admin sees" walkthrough.
    accounts: ["admin", "sysadmin"] satisfies DemoAccountRole[],
    links: [
      { label: HOST_LOGIN_LINK_LABEL, href: `https://${baseDomain}` },
      { label: TUTORIAL_LINK_LABEL, href: TUTORIAL_URL },
    ],
  };
}

/** The client picks a link by its label constant, never by position. */
export function findDemoLinkHref(
  payload: DemoModePayload,
  label: typeof HOST_LOGIN_LINK_LABEL | typeof TUTORIAL_LINK_LABEL,
): string | undefined {
  return payload.notice.links?.find((link) => link.label["en"] === label.en)?.href;
}

export const DEMO_ACCOUNT_LABELS: Record<DemoAccountRole, { de: string; en: string }> = {
  admin: { de: "Host (Events-Workspace)", en: "Host (Events workspace)" },
  sysadmin: { de: "Plattform (Sysadmin)", en: "Platform (sysadmin)" },
};
