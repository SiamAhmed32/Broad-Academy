import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import {
  adminListQuerySchema,
} from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { adminDirectEnrollmentSchema } from "@/lib/enrollments/validation";
import { ensureStudentId } from "@/lib/students/id";
import { z } from "zod";

const enrollmentPatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"]),
});

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.ENROLLMENTS);
  if (error) return error;

  const parsed = adminListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, status, courseId, page, limit } = parsed.data;
  const where = {
    ...(status ? { status: status as "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED" } : {}),
    ...(courseId ? { courseId } : {}),
    ...(search
      ? {
          OR: [
            { user: { fullName: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
            { course: { title: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const { skip, take } = paginate(page, limit);
  const [enrollments, total] = await Promise.all([
    db.enrollment.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
        grantedBy: { select: { fullName: true } },
      },
      orderBy: { enrolledAt: "desc" },
      skip,
      take,
    }),
    db.enrollment.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { enrollments, pagination: paginationMeta(total, page, limit) },
  });
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.ENROLLMENTS);
  if (error || !user) return error!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminDirectEnrollmentSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid enrollment.", 422, parsed.error.flatten().fieldErrors);
  }

  const enrolledAt = new Date();
  const enrollment = await db.$transaction(async (tx) => {
    const record = await tx.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: parsed.data.userId,
          courseId: parsed.data.courseId,
        },
      },
      update: {
        status: "ACTIVE",
        source: "ADMIN_DIRECT",
        grantedById: user.id,
        grantNote: parsed.data.grantNote,
        grantedAt: enrolledAt,
        enrolledAt,
        expiresAt: null,
        completedAt: null,
      },
      create: {
        userId: parsed.data.userId,
        courseId: parsed.data.courseId,
        status: "ACTIVE",
        source: "ADMIN_DIRECT",
        grantedById: user.id,
        grantNote: parsed.data.grantNote,
        grantedAt: enrolledAt,
      },
      include: {
        user: { select: { fullName: true, email: true } },
        course: { select: { title: true } },
      },
    });

    await ensureStudentId(tx, parsed.data.userId, enrolledAt);
    return record;
  });

  return NextResponse.json({ success: true, data: enrollment }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.ENROLLMENTS);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = enrollmentPatchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 422);

  const enrollment = await db.enrollment.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ success: true, data: enrollment });
}
