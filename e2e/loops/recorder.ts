// Screenshot-sequence → GIF. Playwright video caps ~5fps on static UI; stepped
// captures give readable tutorial loops at a predictable duration.

import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import type { Browser, Locator, Page } from "@playwright/test";
import type { PresentIdentity } from "@cosmicdrift/kumiko-testing/e2e";

// Match screenshot runner desktop size — 960×600 felt like a tiny crop with sidebar.
export const HOST_VIEWPORT = { width: 1280, height: 800 };
export const PUBLIC_VIEWPORT = { width: 1280, height: 800 };

const FRAME_MS = 120;
const GIF_FPS = 8 / 0.75;

export interface LoopTools {
  hold: (count?: number) => Promise<void>;
  type: (target: Locator, text: string, framesPerChar?: number) => Promise<void>;
}

function gifFilter(): string {
  return (
    `fps=${GIF_FPS},` +
    "split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3"
  );
}

declare global {
  interface Window {
    __loopPresentRestore?: Array<() => void>;
  }
}

// Runs in the browser, so it may not reference module scope. Mirrors the
// screenshot runner's presentIdentities, which kumiko-testing does not export
// for frame sequences: text and field values are swapped only for the capture
// and restored right after, so the flow keeps typing and submitting real values.
function presentIdentitiesInDocument(mappings: readonly PresentIdentity[]): void {
  const restorers: Array<() => void> = [];
  window.__loopPresentRestore = restorers;
  const present = (text: string): string =>
    mappings.reduce((current, { from, to }) => current.replaceAll(from, to), text);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const textNode = node;
    const original = textNode.nodeValue ?? "";
    const presented = present(original);
    if (presented !== original) {
      textNode.nodeValue = presented;
      restorers.push(() => {
        textNode.nodeValue = original;
      });
    }
  }
  for (const field of document.querySelectorAll("input, textarea")) {
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      const original = field.value;
      const presented = present(original);
      if (presented !== original) {
        field.value = presented;
        restorers.push(() => {
          field.value = original;
        });
      }
    }
  }
}

function restoreIdentitiesInDocument(): void {
  for (const restore of (window.__loopPresentRestore ?? []).reverse()) restore();
  window.__loopPresentRestore = [];
}

async function captureFrame(page: Page, path: string, identities: readonly PresentIdentity[]): Promise<void> {
  if (identities.length > 0) await page.evaluate(presentIdentitiesInDocument, identities);
  try {
    // @template-drift-exception: #224 captureScreenshot only writes one named PNG under SCREENSHOT_DIR, not an indexed frame sequence outside a screenshot run
    await page.screenshot({ path, animations: "disabled" });
  } finally {
    if (identities.length > 0) await page.evaluate(restoreIdentitiesInDocument);
  }
}

async function holdFrames(
  page: Page,
  frameDir: string,
  startIdx: number,
  count: number,
  identities: readonly PresentIdentity[],
): Promise<number> {
  let idx = startIdx;
  for (let i = 0; i < count; i++) {
    const path = resolve(frameDir, `frame-${String(idx).padStart(4, "0")}.png`);
    await captureFrame(page, path, identities);
    idx++;
    // @timeout-exception: #224 GIF frame pacing (deliberate capture interval, not a flakiness wait)
    if (i < count - 1) await page.waitForTimeout(FRAME_MS);
  }
  return idx;
}

function framesToGif(frameDir: string, gifPath: string): void {
  execSync(
    `ffmpeg -y -framerate ${GIF_FPS} -i "${frameDir}/frame-%04d.png" -vf "${gifFilter()}" -loop 0 "${gifPath}"`,
    { stdio: "pipe" },
  );
  const gifStat = statSync(gifPath, { throwIfNoEntry: false });
  if (!gifStat?.isFile() || gifStat.size === 0) {
    throw new Error(`loop recorder produced an empty GIF: ${gifPath}`);
  }
}

function cleanDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) {
    if (f.startsWith("frame-") && f.endsWith(".png")) unlinkSync(resolve(dir, f));
  }
}

async function preparePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("kumiko:locale", "en");
    // An explicit "light" instead of the app default: the toggle cycles
    // light -> dark -> auto, so 02-theme-toggle needs a known starting step.
    localStorage.setItem("kumiko:theme", "light");
  });
}

function makeTools(
  page: Page,
  frameDir: string,
  identities: readonly PresentIdentity[],
  getIdx: () => number,
  setIdx: (n: number) => void,
): LoopTools {
  const hold = async (count = 8): Promise<void> => {
    setIdx(await holdFrames(page, frameDir, getIdx(), count, identities));
  };
  const type = async (target: Locator, text: string, framesPerChar = 3): Promise<void> => {
    await target.click();
    await hold(2);
    for (const char of text) {
      await page.keyboard.type(char);
      setIdx(await holdFrames(page, frameDir, getIdx(), framesPerChar, identities));
    }
  };
  return { hold, type };
}

export async function recordGif(
  browser: Browser,
  frameDir: string,
  gifPath: string,
  viewport: { width: number; height: number },
  run: (page: Page, tools: LoopTools) => Promise<void>,
  baseURL: string,
  identities: readonly PresentIdentity[] = [],
): Promise<void> {
  await recordMultiPartGif(browser, frameDir, gifPath, baseURL, [{ viewport, run }], identities);
}

export async function recordMultiPartGif(
  browser: Browser,
  frameDir: string,
  gifPath: string,
  baseURL: string,
  parts: ReadonlyArray<{
    viewport: { width: number; height: number };
    run: (page: Page, tools: LoopTools) => Promise<void>;
  }>,
  identities: readonly PresentIdentity[] = [],
): Promise<void> {
  cleanDir(frameDir);
  let frameIdx = 0;
  for (const part of parts) {
    const ctx = await browser.newContext({
      baseURL,
      viewport: part.viewport,
    });
    const page = await ctx.newPage();
    await preparePage(page);
    const tools = makeTools(
      page,
      frameDir,
      identities,
      () => frameIdx,
      (n) => {
        frameIdx = n;
      },
    );
    await part.run(page, tools);
    await ctx.close();
  }
  framesToGif(frameDir, gifPath);
}
