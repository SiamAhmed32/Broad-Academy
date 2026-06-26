import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { extractYouTubeVideoId } from "@/lib/video/youtube";

const SITE_CONFIG_ID = "default";

export async function getSiteConfig() {
  try {
    return await db.siteConfig.findUnique({
      where: { id: SITE_CONFIG_ID },
    });
  } catch {
    return null;
  }
}

export const getEnrollmentGuideVideo = unstable_cache(
  async () => {
    const config = await getSiteConfig();
    const rawUrl = config?.enrollmentGuideYoutubeUrl?.trim() || null;
    if (!rawUrl) return null;

    const videoId = extractYouTubeVideoId(rawUrl);
    if (!videoId) return null;

    return {
      videoId,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  },
  ["enrollment-guide-video"],
  { revalidate: 120, tags: ["site-config"] },
);
