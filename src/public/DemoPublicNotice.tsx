import { useTranslation } from "@cosmicdrift/kumiko-renderer";
import { type ReactElement, useEffect, useState } from "react";
import type { DemoModePayload } from "../demo-mode";
import { fetchDemoMode } from "../demo-mode-client";

export function DemoPublicNotice(): ReactElement | null {
  const t = useTranslation();
  const [demo, setDemo] = useState<DemoModePayload | null>(null);

  // kumiko-lint-ignore no-raw-hooks public demo notice — one-shot /api/demo-mode
  useEffect(() => {
    void fetchDemoMode().then(setDemo);
  }, []);

  if (!demo?.readOnly) return null;

  return (
    <div className="rounded-md border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 p-4 text-sm">
      <p className="font-medium text-[var(--color-foreground)]">{t("showpony:demo.public.title")}</p>
      <p className="mt-1 text-[var(--color-muted-foreground)]">{t("showpony:demo.public.body")}</p>
      <p className="mt-2">
        <a
          href={demo.hostLoginUrl}
          className="font-medium text-[var(--color-primary)] hover:underline"
        >
          {t("showpony:demo.public.host-link")}
        </a>
        {" · "}
        <a href={demo.tutorialUrl} className="font-medium text-[var(--color-primary)] hover:underline">
          {t("showpony:demo.public.tutorial-link")}
        </a>
      </p>
    </div>
  );
}
