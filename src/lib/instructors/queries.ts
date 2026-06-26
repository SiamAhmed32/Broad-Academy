import type { Prisma } from "@/generated/prisma/client";

import type { InstructorListQuery } from "@/lib/instructors/validation";

export const publicInstructorSelect = {
  id: true,
  slug: true,
  fullName: true,
  title: true,
  shortBio: true,
  bio: true,
  avatarUrl: true,
  coverUrl: true,
  specialty: true,
  subjects: true,
  expertise: true,
  experienceYears: true,
  studentsCount: true,
  coursesCount: true,
  rating: true,
  reviewCount: true,
  featured: true,
  linkedIn: true,
  twitter: true,
  website: true,
  createdAt: true,
} satisfies Prisma.InstructorSelect;

export const publicInstructorCardSelect = {
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
} satisfies Prisma.InstructorSelect;

export function buildInstructorWhere(query: InstructorListQuery): Prisma.InstructorWhereInput {
  const where: Prisma.InstructorWhereInput = {
    status: "ACTIVE",
  };

  if (query.featured !== undefined) {
    where.featured = query.featured;
  }

  if (query.specialty) {
    where.specialty = {
      equals: query.specialty,
      mode: "insensitive",
    };
  }

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { title: { contains: query.search, mode: "insensitive" } },
      { shortBio: { contains: query.search, mode: "insensitive" } },
      { specialty: { contains: query.search, mode: "insensitive" } },
      { subjects: { has: query.search } },
      { expertise: { has: query.search } },
    ];
  }

  return where;
}

export function buildInstructorOrderBy(
  sort: InstructorListQuery["sort"],
): Prisma.InstructorOrderByWithRelationInput[] {
  switch (sort) {
    case "rating":
      return [{ rating: "desc" }, { reviewCount: "desc" }];
    case "students":
      return [{ studentsCount: "desc" }, { rating: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "featured":
    default:
      return [{ featured: "desc" }, { displayOrder: "asc" }, { rating: "desc" }];
  }
}
