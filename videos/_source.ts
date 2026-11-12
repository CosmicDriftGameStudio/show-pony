import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { EditorLine } from "@cosmicdrift/kumiko-testing/e2e";

const REPO_ROOT = resolve(import.meta.dir, "..");

// Reads the real source so the video code never drifts from the app; the expected
// first line makes a shifted range fail loudly instead of showing the wrong code.
export function fileLines(
  path: string,
  from: number,
  to: number,
  typedLines: readonly number[],
  expectedFirstLine: string,
): EditorLine[] {
  const all = readFileSync(resolve(REPO_ROOT, path), "utf8").split("\n");
  const range = all.slice(from - 1, to);
  const first = range[0];
  if (first === undefined || !first.trimStart().startsWith(expectedFirstLine)) {
    throw new Error(
      `${path}:${from} no longer starts with "${expectedFirstLine}" (found "${first ?? "<eof>"}"); update the video range`,
    );
  }
  if (range.length < to - from + 1) throw new Error(`${path} has fewer than ${to} lines`);
  for (const line of typedLines) {
    if (line < from || line > to)
      throw new Error(`${path}: typed line ${line} is outside ${from}-${to}`);
  }
  return range.map((text, index) => (typedLines.includes(from + index) ? { typed: text } : text));
}
