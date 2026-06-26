import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import {
  buildInstructorOrderBy,
  buildInstructorWhere,
  publicInstructorCardSelect,
  publicInstructorSelect,
} from "@/lib/instructors/queries";
import type {
  InstructorsListResponse,
  InstructorDetailResponse,
} from "@/lib/instructors/types";

export async function fetchInstructorsList(options?: {
  search?: string;
  specialty?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort?: "featured" | "rating" | "students" | "newest";
}) {
  const normalizedOptions = {
    search: options?.search ?? "",
    specialty: options?.specialty ?? "",
    featured: options?.featured ?? undefined,
    page: options?.page ?? 1,
    limit: options?.limit ?? 12,
    sort: options?.sort ?? "featured",
  };

  return fetchCachedInstructorsList(JSON.stringify(normalizedOptions));
}

const fetchCachedInstructorsList = unstable_cache(
  async (serializedOptions: string) =>
    fetchInstructorsListFromDatabase(JSON.parse(serializedOptions)),
  ["instructors-list-v1"],
  {
    revalidate: 120,
    tags: ["instructors"],
  },
);

async function fetchInstructorsListFromDatabase(options: {
  search?: string;
  specialty?: string;
  featured?: boolean;
  page: number;
  limit: number;
  sort: "featured" | "rating" | "students" | "newest";
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 12;
  const sort = options?.sort ?? "featured";

  const where = buildInstructorWhere({
    search: options?.search,
    specialty: options?.specialty,
    featured: options?.featured,
    page,
    limit,
    sort,
  });

  const orderBy = buildInstructorOrderBy(sort);
  const skip = (page - 1) * limit;

  const [instructors, total, specialties] = await Promise.all([
    db.instructor.findMany({
      where,
      select: publicInstructorCardSelect,
      orderBy,
      skip,
      take: limit,
    }),
    db.instructor.count({ where }),
    db.instructor.findMany({
      where: { status: "ACTIVE" },
      select: { specialty: true },
      distinct: ["specialty"],
      orderBy: { specialty: "asc" },
    }),
  ]);

  return {
    instructors,
    specialties: specialties.map((item) => item.specialty),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  } satisfies InstructorsListResponse["data"];
}

export async function fetchInstructorBySlug(slug: string) {
  return fetchCachedInstructorBySlug(slug);
}

const fetchCachedInstructorBySlug = unstable_cache(
  async (slug: string) => fetchInstructorBySlugFromDatabase(slug),
  ["instructor-detail-v1"],
  {
    revalidate: 120,
    tags: ["instructors"],
  },
);

async function fetchInstructorBySlugFromDatabase(slug: string) {
  const instructor = await db.instructor.findFirst({
    where: { slug, status: "ACTIVE" },
    select: publicInstructorSelect,
  });

  if (!instructor) return null;

  const related = await db.instructor.findMany({
    where: {
      status: "ACTIVE",
      specialty: instructor.specialty,
      slug: { not: instructor.slug },
    },
    select: {
      id: true,
      slug: true,
      fullName: true,
      title: true,
      shortBio: true,
      avatarUrl: true,
      specialty: true,
      subjects: true,
      experienceYears: true,
      studentsCount: true,
      coursesCount: true,
      rating: true,
      reviewCount: true,
      featured: true,
    },
    orderBy: [{ featured: "desc" }, { rating: "desc" }],
    take: 3,
  });

  return {
    instructor: {
      ...instructor,
      createdAt: instructor.createdAt.toISOString(),
    },
    related,
  } satisfies InstructorDetailResponse["data"];
}

export async function fetchInstructorSlugs() {
  return fetchCachedInstructorSlugs();
}

const fetchCachedInstructorSlugs = unstable_cache(
  async () => {
  const instructors = await db.instructor.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true },
  });
  return instructors.map((item) => item.slug);
  },
  ["instructor-slugs-v1"],
  {
    revalidate: 120,
    tags: ["instructors"],
  },
);
