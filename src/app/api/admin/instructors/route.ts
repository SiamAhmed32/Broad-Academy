import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

const adminInstructorListSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE", "DRAFT"]).default("ALL"),
  specialty: z.string().trim().max(80).optional(),
  featured: z.enum(["all", "true", "false"]).default("all"),
  sort: z
    .enum(["featured", "rating", "students", "newest", "name-asc", "order"])
    .default("order"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const adminInstructorSelect = {
  id: true,
  slug: true,
  fullName: true,
  title: true,
  specialty: true,
  rating: true,
  reviewCount: true,
  studentsCount: true,
  coursesCount: true,
  featured: true,
  status: true,
  displayOrder: true,
  avatarUrl: true,
  createdAt: true,
} satisfies Prisma.InstructorSelect;

function buildWhere(
  query: z.infer<typeof adminInstructorListSchema>,
): Prisma.InstructorWhereInput {
  const where: Prisma.InstructorWhereInput = {};

  if (query.status !== "ALL") where.status = query.status;
  if (query.featured !== "all") where.featured = query.featured === "true";

  if (query.specialty) {
    where.specialty = { equals: query.specialty, mode: "insensitive" };
  }

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { title: { contains: query.search, mode: "insensitive" } },
      { specialty: { contains: query.search, mode: "insensitive" } },
      { shortBio: { contains: query.search, mode: "insensitive" } },
      { subjects: { has: query.search } },
      { expertise: { has: query.search } },
    ];
  }

  return where;
}

function buildOrderBy(
  sort: z.infer<typeof adminInstructorListSchema>["sort"],
): Prisma.InstructorOrderByWithRelationInput[] {
  switch (sort) {
    case "featured":
      return [{ featured: "desc" }, { displayOrder: "asc" }, { fullName: "asc" }];
    case "rating":
      return [{ rating: "desc" }, { reviewCount: "desc" }];
    case "students":
      return [{ studentsCount: "desc" }, { rating: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "name-asc":
      return [{ fullName: "asc" }];
    case "order":
    default:
      return [{ displayOrder: "asc" }, { fullName: "asc" }];
  }
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.INSTRUCTORS);
  if (error || !user) return error!;

  const parsed = adminInstructorListSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsed.success) {
    return errorResponse("Invalid query parameters.", 422);
  }

  const query = parsed.data;
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.limit;

  const [instructors, total, specialties, counts] = await Promise.all([
    db.instructor.findMany({
      where,
      select: adminInstructorSelect,
      orderBy: buildOrderBy(query.sort),
      skip,
      take: query.limit,
    }),
    db.instructor.count({ where }),
    db.instructor.findMany({
      select: { specialty: true },
      distinct: ["specialty"],
      orderBy: { specialty: "asc" },
    }),
    db.instructor.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        instructors,
        specialties: specialties.map((item) => item.specialty),
        counts: counts.reduce(
          (acc, item) => ({ ...acc, [item.status]: item._count._all }),
          { ACTIVE: 0, INACTIVE: 0, DRAFT: 0 },
        ),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
