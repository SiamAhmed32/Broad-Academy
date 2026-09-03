import { NextResponse } from "next/server";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { loadStudentExamOverviewByAttempt } from "@/lib/exams/monitoring-service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const { attemptId } = await params;
  const overview = await loadStudentExamOverviewByAttempt(attemptId);
  if (!overview) return errorResponse("Exam result not found.", 404);

  return NextResponse.json(
    {
      success: true,
      data: {
        ...overview,
        history: overview.history.map((item) => ({
          ...item,
          submittedAt: item.submittedAt.toISOString(),
        })),
        focusAttempt: overview.focusAttempt
          ? {
              ...overview.focusAttempt,
              submittedAt: overview.focusAttempt.submittedAt.toISOString(),
            }
          : null,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
