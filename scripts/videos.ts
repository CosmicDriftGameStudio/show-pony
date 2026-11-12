// Usage: bun run videos [video-id ...]; no argument records every video.
export {};

const copyAssets = Bun.spawn(["bun", "scripts/copy-marketing-assets.ts"], {
  stdio: ["inherit", "inherit", "inherit"],
});
const copyExitCode = await copyAssets.exited;
if (copyExitCode !== 0) process.exit(copyExitCode);

const ids = process.argv.slice(2);
const proc = Bun.spawn(
  ["bunx", "--bun", "playwright", "test", "--config=playwright.videos.config.ts"],
  {
    stdio: ["inherit", "inherit", "inherit"],
    env: { ...process.env, ...(ids.length > 0 && { VIDEO_ONLY: ids.join(",") }) },
  },
);
process.exit(await proc.exited);
