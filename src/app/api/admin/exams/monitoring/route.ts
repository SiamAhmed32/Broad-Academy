import { NextRequest, NextResponse } from "next/server";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { adminExamMonitoringQuerySchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import {
  loadExamMonitoringFilterOptions,
  loadExamMonitoringRows,
  loadExamMonitoringSummary,
} from "@/lib/exams/monitoring-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const parsed = adminExamMonitoringQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, classLevel, courseId, examId, date, page, limit } = parsed.data;
  const { skip, take } = paginate(page, limit);

  const [{ rows, total }, summary, filterOptions] = await Promise.all([
    loadExamMonitoringRows({ search, classLevel, courseId, examId, date }, { skip, take }),
    loadExamMonitoringSummary(),
    loadExamMonitoringFilterOptions(),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        results: rows.map((row) => ({
          ...row,
          submittedAt: row.submittedAt.toISOString(),
        })),
        summary,
        filterOptions,
        pagination: paginationMeta(total, page, limit),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
