import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { DispatcherProvider, type LinkProps } from "@cosmicdrift/kumiko-renderer";
import { createMockDispatcher } from "@cosmicdrift/kumiko-renderer/testing";
import {
  createStaticLocaleResolver,
  defaultPrimitives,
  LocaleProvider,
  PrimitivesProvider,
} from "@cosmicdrift/kumiko-renderer/web";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EventPage } from "../public/EventPage";
import type { PublicEvent } from "../public/public-event";

const SUMMER_PARTY: PublicEvent = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Sommerfest",
  slug: "sommerfest",
  startsAt: "2026-07-04T16:00:00.000Z",
  location: "Stadtpark",
  description: "",
  guestLimit: null,
};

const renderedLinkProps: LinkProps[] = [];
const recordingPrimitives = {
  ...defaultPrimitives,
  Link: (props: LinkProps): ReactElement => {
    renderedLinkProps.push(props);
    return <defaultPrimitives.Link {...props} />;
  },
};

const mountedRoots: Root[] = [];
const fetchSpy = spyOn(globalThis, "fetch");

afterEach(() => {
  for (const root of mountedRoots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
  fetchSpy.mockReset();
  renderedLinkProps.length = 0;
});

async function renderEventPage(): Promise<HTMLElement> {
  fetchSpy.mockResolvedValue(new Response("not found", { status: 404 }));
  const dispatcher = createMockDispatcher({
    query: (type) =>
      type === "showpony:query:event:by-slug"
        ? { isSuccess: true, data: SUMMER_PARTY }
        : { isSuccess: true, data: {} },
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);
  await act(async () => {
    root.render(
      <DispatcherProvider dispatcher={dispatcher}>
        <PrimitivesProvider value={recordingPrimitives}>
          <LocaleProvider resolver={createStaticLocaleResolver({ locale: "en" })}>
            <EventPage />
          </LocaleProvider>
        </PrimitivesProvider>
      </DispatcherProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return container;
}

describe("EventPage calendar download", () => {
  test("offers the event as an .ics download with a data:text/calendar href", async () => {
    const container = await renderEventPage();
    const calendarLink = container.querySelector("a[download]");
    expect(calendarLink?.getAttribute("download")).toBe("sommerfest.ics");
    const href = calendarLink?.getAttribute("href") ?? "";
    expect(href).not.toBe("#");
    expect(href.startsWith("data:text/calendar")).toBe(true);
  });

  test("renders the calendar link through the Link primitive", async () => {
    await renderEventPage();
    expect(renderedLinkProps.map((props) => props.download)).toContain("sommerfest.ics");
  });
});
