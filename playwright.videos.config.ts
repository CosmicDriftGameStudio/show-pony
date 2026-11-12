// Explainer videos (videos/<id>/video.ts) recorded by the fw's runVideos into
// videos/<id>/out/<locale>.mp4. Needs ffmpeg and OPENROUTER_API_KEY for the
// narration, so it never runs in CI or the normal e2e. Own port so it can run
// next to `bun run e2e`. Record with `bun run videos [video-id ...]`.
import { defineAppE2eConfig, E2E_WORKERS_ENV } from "@cosmicdrift/kumiko-testing/e2e";

export const VIDEOS_PORT = 4188;
// One recording at a time: parallel browsers would drop frames.
process.env[E2E_WORKERS_ENV] = "1";

const config = defineAppE2eConfig({
  port: VIDEOS_PORT,
  serverEntry: "bin/server.ts",
  testDir: "./e2e/videos",
  locale: "en",
  env: { BASE_DOMAIN: "localhost" }, // hostDispatch only treats BASE_DOMAIN as the apex host
});

export default {
  ...config,
  // A recording is not a test: TTS calls plus hundreds of frame screenshots take minutes per video.
  timeout: 25 * 60_000,
};
