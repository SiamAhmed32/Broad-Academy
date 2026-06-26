import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

let homepageOrderColumnAvailable: boolean | null = null;

export async function hasHomepageOrderColumn(): Promise<boolean> {
  if (homepageOrderColumnAvailable !== null) {
    return homepageOrderColumnAvailable;
  }

  try {
    await db.$queryRaw`SELECT "homepageOrder" FROM "Course" LIMIT 1`;
    homepageOrderColumnAvailable = true;
  } catch {
    homepageOrderColumnAvailable = false;
  }

  return homepageOrderColumnAvailable;
}

export async function featuredCourseOrderBy() {
  const hasOrder = await hasHomepageOrderColumn();
  if (hasOrder) {
    return [
      { homepageOrder: "asc" as const },
      { rating: "desc" as const },
      { studentsCount: "desc" as const },
    ];
  }
  return [
    { rating: "desc" as const },
    { studentsCount: "desc" as const },
  ];
}

export async function featuredCourseRawOrderBy() {
  const hasOrder = await hasHomepageOrderColumn();
  return Prisma.raw(
    hasOrder
      ? `"featured" DESC, "homepageOrder" ASC, "studentsCount" DESC, "rating" DESC, "id" ASC`
      : `"featured" DESC, "studentsCount" DESC, "rating" DESC, "id" ASC`,
  );
}
