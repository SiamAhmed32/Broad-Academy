import { unstable_cache } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { courseLevelLabels, courseLevelMap } from "./constants";
import {
  buildCurriculumFromModules,
  computeCourseContentStats,
} from "./content-stats";
import { featuredCourseRawOrderBy } from "./homepage-order";
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
  ["courses-catalogue-v1"],
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
  ["course-detail-v1"],
  {
    revalidate: 60,
    tags: ["courses", "site-config"],
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
      featured: true,
      badge: true,
      publishedAt: true,
    },
  });

  if (!course) return null;

  const [modules, related, enrollmentGuideVideo] = await Promise.all([
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
        featured: true,
        badge: true,
        publishedAt: true,
      },
      orderBy: [{ featured: "desc" }, { rating: "desc" }, { studentsCount: "desc" }],
      take: 3,
    }),
    getEnrollmentGuideVideo(),
  ]);

  const stats = computeCourseContentStats(modules);
  const curriculum = buildCurriculumFromModules(modules);
  const publicCourse = serializeCourse({
    ...course,
    lessonCount: stats.lessonCount,
    durationMinutes: stats.durationMinutes,
  });

  return {
    course: publicCourse,
    ...buildCourseLearningContent(publicCourse, stats, curriculum),
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
  const orderClause =
    query.sort === "featured"
      ? await featuredCourseRawOrderBy()
      : rawOrderBy(query.sort);

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
        "featured",
        "homepageOrder",
        "badge",
        "publishedAt"
      FROM "Course"
      WHERE ${filterConditions(query)}
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
    levels: result.levels.map((item) => ({
      value: item.value,
      label: courseLevelLabels[item.value],
      count: item.count,
    })),
    pagination: {
      page: result.page,
      limit: query.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  };
}

function filterConditions(query: CourseListQuery) {
  return Prisma.sql`
    "status" = 'PUBLISHED'::"CourseStatus"
    ${
      query.search
        ? Prisma.sql`
          AND to_tsvector(
            'english',
            coalesce("title", '') || ' ' ||
            coalesce("shortDescription", '') || ' ' ||
            coalesce("category", '') || ' ' ||
            coalesce("subject", '') || ' ' ||
            coalesce("instructorName", '')
          ) @@ websearch_to_tsquery('english', ${query.search})
        `
        : Prisma.empty
    }
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

function buildCourseLearningContent(
  course: PublicCourse,
  stats: ReturnType<typeof computeCourseContentStats>,
  curriculum: ReturnType<typeof buildCurriculumFromModules>,
) {
  const subject = course.subject;
  const level = courseLevelLabels[course.level];
  const isExamCourse = /board|final|ssc|hsc/i.test(course.title);

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

  return {
    outcomes: [
      `Build a clear, chapter-by-chapter understanding of ${subject}.`,
      "Solve textbook and exam-style problems with a repeatable method.",
      "Identify common mistakes and improve answer presentation.",
      isExamCourse
        ? "Prepare confidently with timed practice and model-test strategies."
        : "Track progress through focused quizzes and guided practice.",
    ],
    requirements: [
      `${level} textbook and a notebook for practice`,
      "A phone, tablet, or computer with a stable internet connection",
      "A willingness to complete short practice tasks after each lesson",
    ],
    includes:
      includes.length > 0
        ? includes
        : [
            "Structured lessons as they are published",
            "Teacher-guided academic support",
            "Mobile and desktop access",
          ],
    curriculum,
  };
}
