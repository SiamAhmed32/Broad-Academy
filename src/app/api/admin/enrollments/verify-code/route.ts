import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

const querySchema = z.object({
  code: z.string().trim().min(4).max(40),
  email: z.string().trim().max(254).optional(),
});

/**
 * Checks a private Facebook group join request: does the access code belong
 * to an active enrollment, and does the email the student gave match it?
 */
export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.ENROLLMENTS);
  if (error) return error;

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return errorResponse("Enter the access code to check.", 422);

  const code = parsed.data.code.toUpperCase().replace(/\s+/g, "");
  const enrollment = await db.enrollment.findUnique({
    where: { accessCode: code },
    select: {
      status: true,
      enrolledAt: true,
      user: { select: { fullName: true, email: true, studentId: true, status: true } },
      course: { select: { title: true } },
    },
  });

  const email = parsed.data.email?.toLowerCase() || null;
  return NextResponse.json(
    {
      success: true,
      data: enrollment
        ? {
            found: true,
            code,
            active: enrollment.status === "ACTIVE" && enrollment.user.status === "ACTIVE",
            enrollmentStatus: enrollment.status,
            accountStatus: enrollment.user.status,
            studentName: enrollment.user.fullName,
            studentEmail: enrollment.user.email,
            studentId: enrollment.user.studentId,
            courseTitle: enrollment.course.title,
            enrolledAt: enrollment.enrolledAt.toISOString(),
            emailMatches: email ? enrollment.user.email.toLowerCase() === email : null,
          }
        : { found: false, code },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
