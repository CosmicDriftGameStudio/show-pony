// Demo-mode notice shared by bin/main.ts (builds it) and the client bundles (read it back).

import type { DemoAccountRole, DemoModePayload } from "@cosmicdrift/kumiko-types/demo-mode-types";

type LocalizedText = Readonly<Record<string, string>>;

export const DEMO_ACCOUNT_LABELS: Record<DemoAccountRole, { de: string; en: string }> = {
  admin: { de: "Host (Events-Workspace)", en: "Host (Events workspace)" },
  sysadmin: { de: "Plattform (Sysadmin)", en: "Platform (sysadmin)" },
};

export const HOST_LOGIN_LINK_LABEL = { de: "Host-Login", en: "Host login" } as const;
export const TUTORIAL_LINK_LABEL = { de: "Tutorial", en: "Tutorial" } as const;
export const TUTORIAL_URL = "https://docs.kumiko.rocks/en/show-pony/";

export function buildDemoNotice(baseDomain: string) {
  return {
    // Publishing the sysadmin login is deliberate: writes are blocked read-only regardless of
    // role, so the only extra exposure is anonymous cross-tenant READS. It backs the
    // tutorial's "here's what a platform admin sees" walkthrough.
    accounts: [
      { role: "admin", label: DEMO_ACCOUNT_LABELS.admin },
      { role: "sysadmin", label: DEMO_ACCOUNT_LABELS.sysadmin },
    ] satisfies { role: DemoAccountRole; label: LocalizedText }[],
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
