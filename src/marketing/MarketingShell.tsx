// @runtime client
import type { ReactNode } from "react";
import { LOGO_PONY } from "../brand-mark";
import { type Lang, renderFooter, renderHeader, SHARED_CSS } from "./layouts/shared";
import { localeRouter } from "./locale-routes";

function currentLang(): Lang {
  if (typeof window === "undefined") return "en";
  return localeRouter.detectLang(window.location.pathname) as Lang;
}

const ASIDE_COPY: Readonly<
  Record<Lang, { readonly headline: string; readonly bullets: readonly string[] }>
> = {
  de: {
    headline: "Events planen. Links teilen. RSVPs sammeln.",
    bullets: [
      "Host-Dashboard auf show-pony.kumiko.rocks",
      "Invite-Seiten auf demo.show-pony.kumiko.rocks",
      "Multi-Tenant — Subdomain ist der Tenant",
    ],
  },
  en: {
    headline: "Plan events. Share links. Collect RSVPs.",
    bullets: [
      "Host dashboard at show-pony.kumiko.rocks",
      "Invite pages at demo.show-pony.kumiko.rocks",
      "Multi-tenant — subdomain is the tenant",
    ],
  },
};

const APEX_SHELL_CSS = `${SHARED_CSS}
.display-contents { display: contents; }
#root { display: flex; flex-direction: column; min-height: 100vh; flex: 1; }
.auth-split { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: center; padding: 4rem 0; }
.auth-aside-pony { width: 120px; height: auto; display: block; margin-bottom: 1.25rem; }
.auth-aside h2 { font-size: clamp(1.5rem, 3vw, 2.1rem); line-height: 1.15; margin: 0 0 1.5rem; color: var(--fg); }
.auth-aside ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.85rem; }
.auth-aside li { position: relative; padding-left: 1.85rem; color: var(--fg-muted); font-size: 1.0625rem; }
.auth-aside li::before { content: ""; position: absolute; left: 0; top: 0.5rem; width: 0.75rem; height: 0.45rem; border-left: 2px solid var(--primary); border-bottom: 2px solid var(--primary); transform: rotate(-45deg); }
.auth-card-wrap { display: flex; justify-content: center; --color-primary: #7c3aed; --color-primary-foreground: #ffffff; --color-ring: #8b5cf6; }
.auth-card-wrap > div { box-shadow: var(--shadow); border-radius: 0.75rem; }
@media (max-width: 860px) {
  .auth-split { grid-template-columns: 1fr; gap: 2rem; padding: 2.5rem 0; }
  .auth-aside { text-align: center; }
  .auth-aside ul { display: none; }
  .auth-aside-pony { width: 96px; margin: 0 auto 1rem; }
}`;

export function MarketingShell({ children }: { readonly children: ReactNode }): ReactNode {
  const lang = currentLang();
  const aside = ASIDE_COPY[lang];
  return (
    <>
      <style>{APEX_SHELL_CSS}</style>
      <div
        className="display-contents"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted server-render from shared.ts
        dangerouslySetInnerHTML={{
          __html: renderHeader(lang, { pathname: window.location.pathname }),
        }}
      />
      <main>
        <div className="container auth-split">
          <aside className="auth-aside">
            <img className="auth-aside-pony" src={LOGO_PONY} alt="Show Pony" />
            <h2>{aside.headline}</h2>
            <ul>
              {aside.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </aside>
          <div className="auth-card-wrap">{children}</div>
        </div>
      </main>
      <div
        className="display-contents"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted server-render from shared.ts
        dangerouslySetInnerHTML={{ __html: renderFooter(lang) }}
      />
    </>
  );
}





