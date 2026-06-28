import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { adminUserListQuerySchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

const OPEN_REQUEST_STATUSES = ["PENDING", "REVIEWING"] as const;

function buildOrderBy(
  sort: string,
): Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[] {
  switch (sort) {
    case "created_asc":
      return { createdAt: "asc" };
    case "name_asc":
      return { fullName: "asc" };
    case "name_desc":
      return { fullName: "desc" };
    case "last_login_desc":
      return [{ lastLoginAt: { sort: "desc", nulls: "last" } }];
    case "enrollments_desc":
      return { enrollments: { _count: "desc" } };
    case "created_desc":
    default:
      return { createdAt: "desc" };
  }
}

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  const parsed = adminUserListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, status, role, enrollment, sort, page, limit } = parsed.data;

  const where: Prisma.UserWhereInput = {
    ...(status ? { status: status as "ACTIVE" | "SUSPENDED" } : {}),
    ...(role !== "all" ? { role } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { studentId: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(enrollment === "enrolled"
      ? { enrollments: { some: { status: "ACTIVE" } } }
      : enrollment === "pending_request"
        ? {
            enrollmentRequests: {
              some: { status: { in: [...OPEN_REQUEST_STATUSES] } },
            },
          }
        : enrollment === "not_enrolled"
          ? {
              enrollments: { none: { status: "ACTIVE" } },
            }
          : {}),
  };

  const { skip, take } = paginate(page, limit);
  const orderBy = buildOrderBy(sort);

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        studentId: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerifiedAt: true,
        adminRole: true,
        _count: {
          select: {
            enrollments: { where: { status: "ACTIVE" } },
            enrollmentRequests: {
              where: { status: { in: [...OPEN_REQUEST_STATUSES] } },
            },
          },
        },
      },
      orderBy,
      skip,
      take,
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { users, pagination: paginationMeta(total, page, limit) },
  });
}
