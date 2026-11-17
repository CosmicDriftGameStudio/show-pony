import type { VideoDefinition } from "@cosmicdrift/kumiko-testing/video";
import fromScratch from "./from-scratch/video";

export const VIDEOS = {
  "from-scratch": fromScratch,
} as const satisfies Record<string, VideoDefinition>;

export const VIDEO_LOCALES = ["en"] as const;
