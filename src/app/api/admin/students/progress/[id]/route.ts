import { NextRequest, NextResponse } from "next/server";

import { getCourseScope } from "@/lib/admin/course-scope";
import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";
import { loadStudentProgressDetail } from "@/lib/students/progress-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS_VIEW);
  if (error || !user) return error!;

  const { id } = await context.params;
  if (!id) return errorResponse("Student id is required.", 422);

  // Teachers may only open students enrolled in their own courses.
  const scope = await getCourseScope(user);
  if (scope) {
    const inScope = await db.enrollment.count({
      where: { userId: id, courseId: { in: scope } },
    });
    if (inScope === 0) return errorResponse("Student not found.", 404);
  }

  const detail = await loadStudentProgressDetail(id);
  if (!detail) return errorResponse("Student not found.", 404);

  return NextResponse.json(
    { success: true, data: detail },
    { headers: { "Cache-Control": "no-store" } },
  );
}
