import { afterEach, describe, expect, spyOn, test } from "bun:test";
import {
  createStaticLocaleResolver,
  defaultPrimitives,
  LocaleProvider,
  PrimitivesProvider,
} from "@cosmicdrift/kumiko-renderer/web";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DemoLoginHint, DemoReadOnlyBanner } from "../demo-mode-ui";

const DEMO_PAYLOAD = {
  readOnly: true,
  notice: {
    links: [{ label: { de: "Tutorial", en: "Tutorial" }, href: "https://docs.test/show-pony/" }],
    accounts: [
      {
        role: "admin",
        label: { de: "Host", en: "Host" },
        email: "host@demo.test",
        password: "demo-pass",
      },
    ],
  },
};

const mountedRoots: Root[] = [];
const uncaughtRenderErrors: unknown[] = [];
const fetchSpy = spyOn(globalThis, "fetch");

afterEach(() => {
  for (const root of mountedRoots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
  uncaughtRenderErrors.length = 0;
  fetchSpy.mockReset();
});

async function renderAndSettle(ui: ReactElement): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container, {
    onUncaughtError: (error) => uncaughtRenderErrors.push(error),
  });
  mountedRoots.push(root);
  await act(async () => {
    root.render(
      <PrimitivesProvider value={defaultPrimitives}>
        <LocaleProvider resolver={createStaticLocaleResolver({ locale: "en" })}>
          {ui}
        </LocaleProvider>
      </PrimitivesProvider>,
    );
  });
  // The /demo-mode response resolves over several promise hops; one macrotask drains them.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return container;
}

function bothDemoWidgets(): ReactElement {
  return (
    <>
      <DemoReadOnlyBanner />
      <DemoLoginHint />
    </>
  );
}

// The hook caches a valid payload for the page's lifetime, so the read-only case runs last.
describe("demo-mode UI", () => {
  test("shows nothing when the server runs without demo mode (404)", async () => {
    fetchSpy.mockResolvedValue(new Response("not found", { status: 404 }));
    const container = await renderAndSettle(bothDemoWidgets());
    expect(container.textContent).toBe("");
  });

  test("shows nothing when /demo-mode cannot be loaded", async () => {
    fetchSpy.mockRejectedValue(new TypeError("network down"));
    const container = await renderAndSettle(bothDemoWidgets());
    expect(container.textContent).toBe("");
  });

  test("shows nothing for a malformed /demo-mode body instead of crashing", async () => {
    fetchSpy.mockResolvedValue(Response.json({ readOnly: true }));
    const container = await renderAndSettle(bothDemoWidgets());
    expect(uncaughtRenderErrors).toEqual([]);
    expect(container.textContent).toBe("");
  });

  test("read-only demo shows banner and login accounts from a single request", async () => {
    fetchSpy.mockResolvedValue(Response.json(DEMO_PAYLOAD));
    const container = await renderAndSettle(bothDemoWidgets());
    const tutorialLink = container.querySelector('[role="status"] a');
    expect(tutorialLink?.getAttribute("href")).toBe("https://docs.test/show-pony/");
    expect(tutorialLink?.className).not.toContain("text-primary");
    expect(container.textContent).toContain("host@demo.test / demo-pass");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
