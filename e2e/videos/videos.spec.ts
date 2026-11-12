import { runVideos } from "@cosmicdrift/kumiko-testing/e2e";
import { VIDEO_LOCALES, VIDEOS } from "../../videos";

runVideos({
  videos: VIDEOS,
  videosDir: new URL("../../videos", import.meta.url).pathname,
  locales: VIDEO_LOCALES,
  aiNotice: { en: "AI voice" },
  brandLogo: new URL("../../public/logos/show-pony-icon.svg", import.meta.url).pathname,
});
