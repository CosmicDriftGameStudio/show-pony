import { describe, expect, test } from "bun:test";
import { renderLegalLayout } from "../legal-layout";
import { renderMarketingLayout } from "../marketing/layouts/marketing";
import { dispatchShowPonyApexStatic } from "../marketing/locale-routes";

describe("show-pony apex static dispatch", () => {
  test("home routes map to locale pages", () => {
    const home = dispatchShowPonyApexStatic("/");
    expect(home?.kind).toBe("html");
    if (home?.kind === "html") expect(home.file).toBe("pages/en/index.html");
    const de = dispatchShowPonyApexStatic("/de");
    if (de?.kind === "html") expect(de.file).toBe("pages/de/index.html");
  });

  test("legacy /en home redirects to /", () => {
    const r = dispatchShowPonyApexStatic("/en");
    expect(r?.kind).toBe("redirect");
    if (r?.kind === "redirect") expect(r.to).toBe("/");
  });

  test("english features at /features", () => {
    const r = dispatchShowPonyApexStatic("/features");
    expect(r?.kind).toBe("html");
    if (r?.kind === "html") expect(r.file).toBe("pages/en/features/index.html");
  });

  test("login path falls through to admin SPA", () => {
    expect(dispatchShowPonyApexStatic("/login")).toBeNull();
  });
});

describe("show-pony marketing render", () => {
  test("landing HTML includes brand and login CTA", () => {
    const html = renderMarketingLayout("en");
    expect(html).toContain("Show Pony");
    expect(html).toContain("/login");
    expect(html).toContain('lang="en"');
  });
});

describe("show-pony legal layout", () => {
  test("wraps body in marketing chrome", () => {
    const html = renderLegalLayout({
      title: "Imprint",
      bodyHtml: "<h1>Imprint</h1><p>Test</p>",
      lang: "en",
    });
    expect(html).toContain("<header");
    expect(html).toContain("Imprint");
    expect(html).toContain("/legal/privacy");
  });
});
