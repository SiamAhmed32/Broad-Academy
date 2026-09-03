import { NextRequest, NextResponse } from "next/server";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { adminStudentProgressQuerySchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";
import { loadStudentProgress } from "@/lib/students/progress-service";
import {
  STUDENT_PROGRESS_STATUSES,
  type StudentProgressStatus,
} from "@/lib/students/progress";

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  const parsed = adminStudentProgressQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, courseId, classLevel, status, sort, page, limit } = parsed.data;

  const now = new Date();
  const [{ rows, truncated }, classGroups] = await Promise.all([
    loadStudentProgress({ search, courseId, classLevel }, now),
    // Class filter options, from the whole student roster rather than the
    // current page so the dropdown does not change as filters are applied.
    db.user.groupBy({
      by: ["classLevel"],
      where: { role: "STUDENT", classLevel: { not: null } },
      orderBy: { classLevel: "asc" },
    }),
  ]);

  // Summary cards describe the search/class/course-filtered population, not the
  // status-filtered slice, so the counts stay stable while switching statuses.
  const summary = STUDENT_PROGRESS_STATUSES.reduce(
    (acc, key) => {
      acc[key] = 0;
      return acc;
    },
    {} as Record<StudentProgressStatus, number>,
  );
  for (const row of rows) summary[row.status] += 1;

  const filtered = status === "all" ? rows : rows.filter((row) => row.status === status);

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "progress_desc":
        return b.progressPercent - a.progressPercent || a.fullName.localeCompare(b.fullName);
      case "last_active_desc":
        return (
          (b.lastActiveAt?.getTime() ?? 0) - (a.lastActiveAt?.getTime() ?? 0) ||
          a.fullName.localeCompare(b.fullName)
        );
      case "last_active_asc":
        return (
          (a.lastActiveAt?.getTime() ?? 0) - (b.lastActiveAt?.getTime() ?? 0) ||
          a.fullName.localeCompare(b.fullName)
        );
      case "name_asc":
        return a.fullName.localeCompare(b.fullName);
      case "name_desc":
        return b.fullName.localeCompare(a.fullName);
      case "class_asc":
        return (
          (a.classLevel ?? Number.MAX_SAFE_INTEGER) -
            (b.classLevel ?? Number.MAX_SAFE_INTEGER) ||
          a.fullName.localeCompare(b.fullName)
        );
      case "progress_asc":
      default:
        return a.progressPercent - b.progressPercent || a.fullName.localeCompare(b.fullName);
    }
  });

  const { skip, take } = paginate(page, limit);
  const pageRows = sorted.slice(skip, skip + take);

  return NextResponse.json(
    {
      success: true,
      data: {
        students: pageRows.map((row) => ({
          id: row.id,
          fullName: row.fullName,
          email: row.email,
          phone: row.phone,
          studentId: row.studentId,
          classLevel: row.classLevel,
          avatarUrl: row.avatarUrl,
          accountStatus: row.accountStatus,
          createdAt: row.createdAt,
          lastLoginAt: row.lastLoginAt,
          openRequestCount: row.openRequestCount,
          enrolledAt: row.enrolledAt,
          courseCount: row.courseCount,
          courseTitles: row.courseTitles,
          completedLessons: row.completedLessons,
          totalLessons: row.totalLessons,
          progressPercent: row.progressPercent,
          lastActiveAt: row.lastActiveAt,
          status: row.status,
        })),
        summary: {
          total: rows.length,
          ...summary,
        },
        classLevels: classGroups
          .map((group) => group.classLevel)
          .filter((value): value is number => typeof value === "number"),
        truncated,
        pagination: paginationMeta(sorted.length, page, limit),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
