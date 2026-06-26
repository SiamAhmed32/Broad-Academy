import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { adminListQuerySchema, adminStudentUpdateSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

const studentPatchSchema = adminStudentUpdateSchema.extend({
  id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  const parsed = adminListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, status, page, limit } = parsed.data;
  const where = {
    role: "STUDENT" as const,
    ...(status ? { status: status as "ACTIVE" | "SUSPENDED" } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const { skip, take } = paginate(page, limit);
  const [students, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { students, pagination: paginationMeta(total, page, limit) },
  });
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = studentPatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid data.", 422, parsed.error.flatten().fieldErrors);
  }

  const { id, status } = parsed.data;

  const student = await db.user.update({
    where: { id, role: "STUDENT" },
    data: { ...(status ? { status } : {}) },
    select: { id: true, fullName: true, email: true, status: true },
  });

  return NextResponse.json({ success: true, data: student });
}
