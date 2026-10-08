import { unstable_cache } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { courseLevelLabels, courseLevelMap } from "./constants";
import { computeCourseContentStats } from "./content-stats";
import { featuredCourseRawOrderBy } from "./homepage-order";
import { matchCourseInstructors } from "./instructors";
import {
  courseSearchFilter,
  courseSearchOrderBy,
  hasTrigramSearch,
} from "./search";
import { getEnrollmentGuideVideo } from "@/lib/site/config";
import type {
  CourseDetailData,
  CourseFacet,
  CoursesListData,
  PublicCourse,
} from "./types";
import type { CourseListQuery } from "./validation";

type CatalogueRow = {
  courses: PublicCourse[];
  categories: CourseFacet[];
  levels: Array<{ value: PublicCourse["level"]; count: number }>;
  total: number;
  page: number;
  totalPages: number;
};

const fetchCachedCourses = unstable_cache(
  async (serializedQuery: string) =>
    fetchCoursesFromDatabase(JSON.parse(serializedQuery) as CourseListQuery),
  ["courses-catalogue-v4"],
  {
    revalidate: 60,
    tags: ["courses"],
  },
);

export async function fetchCourses(
  query: CourseListQuery,
): Promise<CoursesListData> {
  return fetchCachedCourses(JSON.stringify(query));
}

export async function fetchCourseBySlug(
  slug: string,
): Promise<CourseDetailData | null> {
  return fetchCachedCourseBySlug(slug);
}

const fetchCachedCourseBySlug = unstable_cache(
  async (slug: string) => fetchCourseBySlugFromDatabase(slug),
  ["course-detail-v2"],
  {
    revalidate: 60,
    tags: ["courses", "instructors", "site-config"],
  },
);

async function fetchCourseBySlugFromDatabase(
  slug: string,
): Promise<CourseDetailData | null> {
  const course = await db.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
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
      examCount: true,
      featured: true,
      badge: true,
      publishedAt: true,
      description: true,
      includes: true,
    },
  });

  if (!course) return null;

  const [modules, related, enrollmentGuideVideo, instructorProfiles] = await Promise.all([
    db.courseModule.findMany({
      where: { courseId: course.id },
      orderBy: { displayOrder: "asc" },
      select: {
        title: true,
        lessons: {
          orderBy: { displayOrder: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            durationSeconds: true,
          },
        },
      },
    }),
    db.course.findMany({
      where: {
        status: "PUBLISHED",
        id: { not: course.id },
        OR: [{ category: course.category }, { level: course.level }],
      },
      select: {
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
        examCount: true,
        featured: true,
        badge: true,
        publishedAt: true,
      },
      orderBy: [{ featured: "desc" }, { rating: "desc" }, { studentsCount: "desc" }],
      take: 3,
    }),
    getEnrollmentGuideVideo(),
    db.instructor.findMany({
      where: { status: "ACTIVE" },
      select: {
        slug: true,
        fullName: true,
        avatarUrl: true,
        subjects: true,
        specialty: true,
      },
    }),
  ]);

  const stats = computeCourseContentStats(modules);
  const { description, includes, ...courseFields } = course;
  const publicCourse = serializeCourse({
    ...courseFields,
    lessonCount: stats.lessonCount,
    durationMinutes: stats.durationMinutes,
  });
  const customIncludes = includes.map((item) => item.trim()).filter(Boolean);

  return {
    course: { ...publicCourse, description: description?.trim() || null },
    includes: customIncludes.length
      ? customIncludes
      : buildGeneratedIncludes(stats),
    instructors: matchCourseInstructors(
      course.instructorName,
      instructorProfiles,
      course.subject,
    ),
    related: related.map(serializeCourse),
    enrollmentGuideVideo,
  };
}

export async function fetchCourseSlugs() {
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return courses.map((course) => course.slug);
}

export async function fetchCoursesFromDatabase(
  query: CourseListQuery,
): Promise<CoursesListData> {
  const [sortOrder, useTrigram] = await Promise.all([
    query.sort === "featured"
      ? featuredCourseRawOrderBy()
      : Promise.resolve(rawOrderBy(query.sort)),
    hasTrigramSearch(),
  ]);
  const orderClause = courseSearchOrderBy(query.search, sortOrder, useTrigram);

  const rows = await db.$queryRaw<CatalogueRow[]>`
    WITH "filtered" AS (
      SELECT
        "id",
        "slug",
        "title",
        "shortDescription",
        "category",
        "level",
        "subject",
        "instructorName",
        "thumbnailUrl",
        "price",
        "originalPrice",
        "durationMinutes",
        "lessonCount",
        "rating",
        "reviewCount",
        "studentsCount",
        "examCount",
        "featured",
        "homepageOrder",
        "badge",
        "publishedAt"
      FROM "Course"
      WHERE ${filterConditions(query, useTrigram)}
    ),
    "ranked" AS (
      SELECT
        "filtered".*,
        row_number() OVER (ORDER BY ${orderClause}) AS "rowNumber"
      FROM "filtered"
    ),
    "metrics" AS (
      SELECT count(*)::int AS "total"
      FROM "filtered"
    ),
    "pageInfo" AS (
      SELECT
        "total",
        GREATEST(1, ceil("total"::numeric / ${query.limit})::int) AS "totalPages",
        LEAST(
          ${query.page},
          GREATEST(1, ceil("total"::numeric / ${query.limit})::int)
        ) AS "page"
      FROM "metrics"
    ),
    "categoryFacets" AS (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'value', "category",
            'label', "category",
            'count', "count"
          )
          ORDER BY "category"
        ),
        '[]'::jsonb
      ) AS "items"
      FROM (
        SELECT "category", count(*)::int AS "count"
        FROM "Course"
        WHERE "status" = 'PUBLISHED'::"CourseStatus"
        GROUP BY "category"
      ) AS "categories"
    ),
    "levelFacets" AS (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'value', "level",
            'count', "count"
          )
          ORDER BY "level"::text
        ),
        '[]'::jsonb
      ) AS "items"
      FROM (
        SELECT "level", count(*)::int AS "count"
        FROM "Course"
        WHERE "status" = 'PUBLISHED'::"CourseStatus"
        GROUP BY "level"
      ) AS "levels"
    )
    SELECT
      coalesce(
        (
          SELECT jsonb_agg(
            to_jsonb("ranked") - 'rowNumber'
            ORDER BY "rowNumber"
          )
          FROM "ranked"
          CROSS JOIN "pageInfo"
          WHERE "rowNumber" > (("page" - 1) * ${query.limit})
            AND "rowNumber" <= ("page" * ${query.limit})
        ),
        '[]'::jsonb
      ) AS "courses",
      "categoryFacets"."items" AS "categories",
      "levelFacets"."items" AS "levels",
      "pageInfo"."total",
      "pageInfo"."page",
      "pageInfo"."totalPages"
    FROM "pageInfo"
    CROSS JOIN "categoryFacets"
    CROSS JOIN "levelFacets"
  `;

  const result = rows[0] ?? {
    courses: [],
    categories: [],
    levels: [],
    total: 0,
    page: 1,
    totalPages: 1,
  };

  return {
    courses: result.courses,
    categories: result.categories,
    levels: result.levels
      .map((item) => ({
        value: item.value,
        label: courseLevelLabels[item.value],
        count: item.count,
      }))
      .sort((a, b) => levelOrder(a.value) - levelOrder(b.value)),
    pagination: {
      page: result.page,
      limit: query.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  };
}

function filterConditions(query: CourseListQuery, useTrigram: boolean) {
  return Prisma.sql`
    "status" = 'PUBLISHED'::"CourseStatus"
    ${courseSearchFilter(query.search, useTrigram)}
    ${
      query.category
        ? Prisma.sql`AND lower("category") = lower(${query.category})`
        : Prisma.empty
    }
    ${
      query.level
        ? Prisma.sql`AND "level" = ${courseLevelMap[query.level]}::"CourseLevel"`
        : Prisma.empty
    }
  `;
}

function rawOrderBy(sort: Exclude<CourseListQuery["sort"], "featured">) {
  const orderBy: Record<Exclude<CourseListQuery["sort"], "featured">, string> = {
    popular: `"studentsCount" DESC, "rating" DESC, "id" ASC`,
    rating: `"rating" DESC, "reviewCount" DESC, "id" ASC`,
    newest: `"publishedAt" DESC NULLS LAST, "id" ASC`,
    "price-low": `"price" ASC, "rating" DESC, "id" ASC`,
    "price-high": `"price" DESC, "rating" DESC, "id" ASC`,
  };
  return Prisma.raw(orderBy[sort]);
}

function serializeCourse(
  course: Omit<PublicCourse, "publishedAt"> & { publishedAt: Date | null },
): PublicCourse {
  return {
    ...course,
    publishedAt: course.publishedAt?.toISOString() ?? null,
  };
}

/** Fallback "This course includes" list, used until Admin adds its own lines. */
function buildGeneratedIncludes(
  stats: ReturnType<typeof computeCourseContentStats>,
) {
  const includes = [
    stats.videoCount > 0
      ? `${stats.videoCount} video lesson${stats.videoCount === 1 ? "" : "s"}`
      : null,
    stats.readingCount > 0
      ? `${stats.readingCount} reading lesson${stats.readingCount === 1 ? "" : "s"}`
      : null,
    stats.quizCount > 0
      ? `${stats.quizCount} quiz${stats.quizCount === 1 ? "" : "zes"} & assessments`
      : null,
    stats.lessonCount > 0 ? "Downloadable practice resources" : null,
    "Teacher-guided academic support",
    "Mobile and desktop access",
    "Completion progress tracking",
  ].filter((item): item is string => Boolean(item));

  return includes.length > 0
    ? includes
    : [
        "Structured lessons as they are published",
        "Teacher-guided academic support",
        "Mobile and desktop access",
      ];
}

function levelOrder(level: PublicCourse["level"]) {
  const order = Object.values(courseLevelMap);
  const index = order.indexOf(level);
  return index === -1 ? order.length : index;
}
