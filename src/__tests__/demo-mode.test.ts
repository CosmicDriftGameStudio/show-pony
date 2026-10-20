import { describe, expect, test } from "bun:test";
import {
  buildDemoNotice,
  DEMO_ACCOUNT_LABELS,
  type DemoModePayload,
  findDemoLinkHref,
  HOST_LOGIN_LINK_LABEL,
  TUTORIAL_LINK_LABEL,
  TUTORIAL_URL,
} from "../demo-mode-notice";

describe("demo-mode notice", () => {
  test("publishes the host and sysadmin accounts and both links", () => {
    const notice = buildDemoNotice("show-pony.kumiko.rocks");
    expect(notice.accounts.map((account) => account.role)).toEqual(["admin", "sysadmin"]);
    expect(notice.links.map((link) => link.href)).toEqual([
      "https://show-pony.kumiko.rocks",
      TUTORIAL_URL,
    ]);
  });

  test("every published account role has a label", () => {
    for (const { role, label } of buildDemoNotice("x.test").accounts) {
      expect(label).toEqual(DEMO_ACCOUNT_LABELS[role]);
      expect(DEMO_ACCOUNT_LABELS[role].en.length).toBeGreaterThan(0);
    }
  });

  test("findDemoLinkHref picks by label, not by position", () => {
    const payload: DemoModePayload = {
      readOnly: true,
      notice: {
        accounts: [],
        links: [
          { label: TUTORIAL_LINK_LABEL, href: "https://docs.test/" },
          { label: HOST_LOGIN_LINK_LABEL, href: "https://host.test" },
        ],
      },
    };
    expect(findDemoLinkHref(payload, HOST_LOGIN_LINK_LABEL)).toBe("https://host.test");
    expect(findDemoLinkHref(payload, TUTORIAL_LINK_LABEL)).toBe("https://docs.test/");
    expect(
      findDemoLinkHref({ readOnly: false, notice: { accounts: [] } }, TUTORIAL_LINK_LABEL),
    ).toBeUndefined();
  });
});
