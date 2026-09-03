import { NextRequest, NextResponse } from "next/server";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { loadStudentProgressDetail } from "@/lib/students/progress-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  const { id } = await context.params;
  if (!id) return errorResponse("Student id is required.", 422);

  const detail = await loadStudentProgressDetail(id);
  if (!detail) return errorResponse("Student not found.", 404);

  return NextResponse.json(
    { success: true, data: detail },
    { headers: { "Cache-Control": "no-store" } },
  );
}
