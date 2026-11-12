import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { findVideoTextGaps } from "@cosmicdrift/kumiko-testing/e2e";
import { VIDEO_LOCALES, VIDEOS } from "./index";

describe("video texts", () => {
  for (const [id, video] of Object.entries(VIDEOS)) {
    test(`${id} has a text for every scene in every locale`, () => {
      expect(findVideoTextGaps(video, join(import.meta.dir, id), VIDEO_LOCALES)).toEqual([]);
    });
  }
});
