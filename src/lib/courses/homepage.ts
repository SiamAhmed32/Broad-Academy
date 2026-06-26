import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { featuredCourseOrderBy } from "./homepage-order";
import type { PublicCourse } from "./types";

const publicCourseSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  category: true,
  level: true,
  subject: true,
  instructorName: true,
  thumbnailUrl: true,
  price: true,
  originalPrice: true,
  durationMinutes: true,
  lessonCount: true,
  rating: true,
  reviewCount: true,
  studentsCount: true,
  featured: true,
  badge: true,
  publishedAt: true,
} as const;

function serializeCourse(
  course: {
    publishedAt: Date | null;
  } & Omit<PublicCourse, "publishedAt">,
): PublicCourse {
  return {
    ...course,
    publishedAt: course.publishedAt?.toISOString() ?? null,
  };
}

async function loadHomepageCourses(limit: number): Promise<PublicCourse[]> {
  const orderBy = await featuredCourseOrderBy();

  const featured = await db.course.findMany({
    where: { status: "PUBLISHED", featured: true },
    orderBy,
    take: limit,
    select: publicCourseSelect,
  });

  if (featured.length >= limit) {
    return featured.map(serializeCourse);
  }

  const featuredIds = featured.map((course) => course.id);
  const filler = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(featuredIds.length ? { id: { notIn: featuredIds } } : {}),
    },
    orderBy: [
      { rating: "desc" },
      { studentsCount: "desc" },
      { publishedAt: "desc" },
    ],
    take: limit - featured.length,
    select: publicCourseSelect,
  });

  return [...featured, ...filler].map(serializeCourse);
}

export const fetchHomepageCourses = unstable_cache(
  async (limit = 6) => loadHomepageCourses(limit),
  ["homepage-courses-v2"],
  { revalidate: 60, tags: ["courses"] },
);
