import type { Prisma } from "@/generated/prisma/client";

import { courseLevelMap } from "./constants";
import type { CourseListQuery } from "./validation";

export const publicCourseSelect = {
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
} satisfies Prisma.CourseSelect;

export function buildCourseWhere(
  query: CourseListQuery,
): Prisma.CourseWhereInput {
  return {
    status: "PUBLISHED",
    ...(query.category
      ? { category: { equals: query.category, mode: "insensitive" as const } }
      : {}),
    ...(query.level ? { level: courseLevelMap[query.level] } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" as const } },
            {
              shortDescription: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              category: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              subject: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              instructorName: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };
}

export function buildCourseOrderBy(
  sort: CourseListQuery["sort"],
): Prisma.CourseOrderByWithRelationInput[] {
  switch (sort) {
    case "popular":
      return [{ studentsCount: "desc" }, { rating: "desc" }, { id: "asc" }];
    case "rating":
      return [{ rating: "desc" }, { reviewCount: "desc" }, { id: "asc" }];
    case "newest":
      return [{ publishedAt: "desc" }, { id: "asc" }];
    case "price-low":
      return [{ price: "asc" }, { rating: "desc" }, { id: "asc" }];
    case "price-high":
      return [{ price: "desc" }, { rating: "desc" }, { id: "asc" }];
    case "featured":
    default:
      return [
        { featured: "desc" },
        { studentsCount: "desc" },
        { rating: "desc" },
        { id: "asc" },
      ];
  }
}
