import { describe, expect, test } from "bun:test";
import { renderLegalLayout } from "../legal-layout";
import { renderMarketingLayout } from "../marketing/layouts/marketing";
import { dispatchShowPonyApexStatic } from "../marketing/locale-routes";

describe("show-pony apex static dispatch", () => {
  test("home routes map to locale pages", () => {
    const home = dispatchShowPonyApexStatic("/");
    expect(home?.kind).toBe("html");
    if (home?.kind === "html") expect(home.file).toBe("pages/de/index.html");
    const en = dispatchShowPonyApexStatic("/en");
    if (en?.kind === "html") expect(en.file).toBe("pages/en/index.html");
  });

  test("english aliases redirect", () => {
    const r = dispatchShowPonyApexStatic("/features");
    expect(r?.kind).toBe("redirect");
    if (r?.kind === "redirect") expect(r.to).toBe("/en/features");
  });

  test("login path falls through to admin SPA", () => {
    expect(dispatchShowPonyApexStatic("/login")).toBeNull();
  });
});

describe("show-pony marketing render", () => {
  test("landing HTML includes brand and login CTA", () => {
    const html = renderMarketingLayout("de");
    expect(html).toContain("Show Pony");
    expect(html).toContain("/login");
    expect(html).toContain('lang="de"');
  });
});

describe("show-pony legal layout", () => {
  test("wraps body in marketing chrome", () => {
    const html = renderLegalLayout({
      title: "Impressum",
      bodyHtml: "<h1>Impressum</h1><p>Test</p>",
      lang: "de",
    });
    expect(html).toContain("<header");
    expect(html).toContain("Impressum");
    expect(html).toContain("/legal/datenschutz");
  });
});
