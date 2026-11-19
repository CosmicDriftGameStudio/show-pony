import { useTranslation } from "@cosmicdrift/kumiko-renderer";
import type { DemoModePayload } from "@cosmicdrift/kumiko-types/demo-mode-types";
import type { ReactElement } from "react";
import { findDemoLinkHref, HOST_LOGIN_LINK_LABEL, TUTORIAL_LINK_LABEL } from "../demo-mode-notice";

export function DemoPublicNotice({
  demo,
}: {
  readonly demo: DemoModePayload;
}): ReactElement | null {
  const t = useTranslation();

  if (!demo.readOnly) return null;
  const hostLoginUrl = findDemoLinkHref(demo, HOST_LOGIN_LINK_LABEL);
  const tutorialUrl = findDemoLinkHref(demo, TUTORIAL_LINK_LABEL);

  return (
    <div className="rounded-md border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 p-4 text-sm">
      <p className="font-medium text-[var(--color-foreground)]">
        {t("showpony:demo.public.title")}
      </p>
      <p className="mt-1 text-[var(--color-muted-foreground)]">{t("showpony:demo.public.body")}</p>
      <p className="mt-2">
        {hostLoginUrl !== undefined && (
          <a
            href={hostLoginUrl}
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            {t("showpony:demo.public.host-link")}
          </a>
        )}
        {hostLoginUrl !== undefined && tutorialUrl !== undefined && " · "}
        {tutorialUrl !== undefined && (
          <a href={tutorialUrl} className="font-medium text-[var(--color-primary)] hover:underline">
            {t("showpony:demo.public.tutorial-link")}
          </a>
        )}
      </p>
    </div>
  );
}
