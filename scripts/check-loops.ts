#!/usr/bin/env bun

import { execFileSync } from "node:child_process";

try {
  const version = execFileSync("ffmpeg", ["-version"], { encoding: "utf8" });
  const firstLine = version.split("\n", 1)[0]?.trim() ?? "ffmpeg";
  process.stdout.write(`✓ ${firstLine}\n`);
} catch {
  process.stderr.write(
    "✖ ffmpeg is required for `bun run loops`; install ffmpeg and retry.\n",
  );
  process.exit(1);
}
