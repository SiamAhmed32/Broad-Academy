import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";

export const getActiveAnnouncement = unstable_cache(
  async () =>
    db.announcement.findFirst({
      where: { isActive: true },
    }),
  ["active-announcement"],
  { revalidate: 60, tags: ["announcements"] },
);
