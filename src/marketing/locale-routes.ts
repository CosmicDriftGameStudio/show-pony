import { createLocaleRouter } from "@cosmicdrift/kumiko-headless/locale-routing";

export type ShowPonyPage = "home" | "features" | "pricing";

export const localeRouter = createLocaleRouter<ShowPonyPage>({
  defaultLocale: "de",
  prefixedLocales: ["en"],
  routes: {
    home: { de: "/", en: "/en" },
    features: { de: "/funktionen", en: "/en/features" },
    pricing: { de: "/preise", en: "/en/pricing" },
  },
  localeHints: { en: ["/features", "/pricing"] },
});

/** Apex hostDispatch matrix for static marketing HTML (dev + prod). */
export function dispatchShowPonyApexStatic(
  path: string,
):
  | { kind: "html"; file: string; injectSchema?: boolean }
  | { kind: "redirect"; to: string; status: 301 }
  | null {
  if (path === "/" || path === "/de" || path === "/de/") {
    return { kind: "html", file: "pages/de/index.html", injectSchema: false };
  }
  if (path === "/en" || path === "/en/") {
    return { kind: "html", file: "pages/en/index.html", injectSchema: false };
  }
  if (path === "/funktionen" || path === "/funktionen/") {
    return { kind: "html", file: "pages/de/features/index.html", injectSchema: false };
  }
  if (path === "/features" || path === "/features/") {
    return { kind: "redirect", to: "/en/features", status: 301 };
  }
  if (path === "/en/features" || path === "/en/features/") {
    return { kind: "html", file: "pages/en/features/index.html", injectSchema: false };
  }
  if (path === "/preise" || path === "/preise/") {
    return { kind: "html", file: "pages/de/pricing/index.html", injectSchema: false };
  }
  if (path === "/pricing" || path === "/pricing/") {
    return { kind: "redirect", to: "/en/pricing", status: 301 };
  }
  if (path === "/en/pricing" || path === "/en/pricing/") {
    return { kind: "html", file: "pages/en/pricing/index.html", injectSchema: false };
  }
  return null;
}

export function dispatchShowPonyApexStaticDev(
  path: string,
): { kind: "static-html"; file: string } | { kind: "redirect"; to: string; status: 301 } | null {
  const prod = dispatchShowPonyApexStatic(path);
  if (prod === null) return null;
  if (prod.kind === "redirect") return prod;
  return { kind: "static-html", file: `./dist/${prod.file}` };
}

/** True when apex should serve the admin SPA (login + authenticated app). */
export function isShowPonyApexAdminPath(path: string): boolean {
  return dispatchShowPonyApexStatic(path) === null;
}
