// Screenshot-sequence → GIF. Playwright video caps ~5fps on static UI; stepped
// captures give readable tutorial loops at a predictable duration.

import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import type { Browser, Locator, Page } from "@playwright/test";

// One canvas size for every clip — mixed PNG dimensions break ffmpeg palettegen.
export const HOST_VIEWPORT = { width: 960, height: 600 };
export const PUBLIC_VIEWPORT = { width: 960, height: 600 };

const FRAME_MS = 160;
const GIF_FPS = 8;

export interface LoopTools {
  hold: (count?: number) => Promise<void>;
  /** Types char-by-char with a screenshot after each — visible in the GIF. */
  type: (target: Locator, text: string, framesPerChar?: number) => Promise<void>;
}

function gifFilter(): string {
  return (
    `fps=${GIF_FPS},` +
    "split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3"
  );
}

async function holdFrames(page: Page, frameDir: string, startIdx: number, count: number): Promise<number> {
  let idx = startIdx;
  for (let i = 0; i < count; i++) {
    const path = resolve(frameDir, `frame-${String(idx).padStart(4, "0")}.png`);
    await page.screenshot({ path, animations: "disabled" });
    idx++;
    if (i < count - 1) await page.waitForTimeout(FRAME_MS);
  }
  return idx;
}

function framesToGif(frameDir: string, gifPath: string): void {
  execSync(
    `ffmpeg -y -framerate ${GIF_FPS} -i "${frameDir}/frame-%04d.png" -vf "${gifFilter()}" -loop 0 "${gifPath}"`,
    { stdio: "pipe" },
  );
}

function cleanDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) {
    if (f.startsWith("frame-") && f.endsWith(".png")) unlinkSync(resolve(dir, f));
  }
}

function makeTools(page: Page, frameDir: string, getIdx: () => number, setIdx: (n: number) => void): LoopTools {
  const hold = async (count = 8): Promise<void> => {
    setIdx(await holdFrames(page, frameDir, getIdx(), count));
  };
  const type = async (target: Locator, text: string, framesPerChar = 3): Promise<void> => {
    await target.click();
    await hold(2);
    for (const char of text) {
      await page.keyboard.type(char);
      setIdx(await holdFrames(page, frameDir, getIdx(), framesPerChar));
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
  storageState?: string,
): Promise<void> {
  await recordMultiPartGif(browser, frameDir, gifPath, [{ viewport, storageState, run }]);
}

export async function recordMultiPartGif(
  browser: Browser,
  frameDir: string,
  gifPath: string,
  parts: ReadonlyArray<{
    viewport: { width: number; height: number };
    storageState?: string;
    run: (page: Page, tools: LoopTools) => Promise<void>;
  }>,
): Promise<void> {
  cleanDir(frameDir);
  let frameIdx = 0;
  for (const part of parts) {
    const ctx = await browser.newContext({
      ...(part.storageState ? { storageState: part.storageState } : {}),
      viewport: part.viewport,
    });
    const page = await ctx.newPage();
    const tools = makeTools(
      page,
      frameDir,
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
