import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS, canManageStaffRoles } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ userId: string }> };

const assignSchema = z.object({
  courseIds: z.array(z.string().min(1)).max(500),
});

async function loadTeacher(userId: string) {
  return db.user.findFirst({
    where: { id: userId, role: "ADMIN", adminRole: "TEACHER" },
    select: { id: true },
  });
}

/** Courses a teacher is assigned to, plus every course to choose from. */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { user: actor, error } = await requireStaffApi(ADMIN_PERMISSIONS.USERS);
  if (error || !actor) return error!;

  const { userId } = await context.params;
  if (!(await loadTeacher(userId))) {
    return errorResponse("Teacher not found.", 404);
  }

  const [courses, assigned] = await Promise.all([
    db.course.findMany({
      select: { id: true, title: true, status: true },
      orderBy: { title: "asc" },
    }),
    db.courseTeacher.findMany({ where: { userId }, select: { courseId: true } }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: { courses, assignedCourseIds: assigned.map((row) => row.courseId) },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user: actor, error } = await requireStaffApi(ADMIN_PERMISSIONS.USERS);
  if (error || !actor) return error!;
  if (!canManageStaffRoles(actor.adminRole)) {
    return errorResponse("Only owners and admins can assign teachers.", 403);
  }

  const { userId } = await context.params;
  if (!(await loadTeacher(userId))) {
    return errorResponse("Teacher not found.", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid course list.", 422);

  const courseIds = [...new Set(parsed.data.courseIds)];
  const existing = await db.course.count({ where: { id: { in: courseIds } } });
  if (existing !== courseIds.length) {
    return errorResponse("One or more courses no longer exist. Refresh and try again.", 409);
  }

  await db.$transaction([
    db.courseTeacher.deleteMany({ where: { userId } }),
    db.courseTeacher.createMany({
      data: courseIds.map((courseId) => ({ courseId, userId })),
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: "Teacher courses updated.",
    data: { assignedCourseIds: courseIds },
  });
}
