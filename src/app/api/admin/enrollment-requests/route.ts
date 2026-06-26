import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { adminListQuerySchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { enrollmentReviewSchema } from "@/lib/enrollments/validation";
import { sendEnrollmentDecisionEmail } from "@/lib/enrollments/email";
import { ensureStudentId } from "@/lib/students/id";
import { createUserNotification, notifyActiveAdmins } from "@/lib/notifications/service";

const enrollmentRequestDetailInclude = {
  user: {
    select: { id: true, fullName: true, email: true, phone: true },
  },
  course: { select: { id: true, title: true, slug: true, price: true } },
  reviewedBy: { select: { fullName: true } },
} as const;

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.ENROLLMENTS);
  if (error) return error;

  const parsed = adminListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, status, courseId, id, page, limit } = parsed.data;
  const where = id
    ? { id }
    : {
        ...(status
          ? {
              status: status as
                | "PENDING"
                | "REVIEWING"
                | "APPROVED"
                | "REJECTED"
                | "CANCELLED",
            }
          : {}),
        ...(courseId ? { courseId } : {}),
        ...(search
          ? {
              OR: [
                { user: { fullName: { contains: search, mode: "insensitive" as const } } },
                { user: { email: { contains: search, mode: "insensitive" as const } } },
                { course: { title: { contains: search, mode: "insensitive" as const } } },
                { bkashTransactionId: { contains: search, mode: "insensitive" as const } },
                { studentPhone: { contains: search, mode: "insensitive" as const } },
                { guardianPhone: { contains: search, mode: "insensitive" as const } },
                { bkashSenderNumber: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

  const { skip, take } = paginate(page, limit);
  const [requests, total] = await Promise.all([
    db.enrollmentRequest.findMany({
      where,
      include: enrollmentRequestDetailInclude,
      orderBy: { submittedAt: "desc" },
      skip,
      take,
    }),
    db.enrollmentRequest.count({ where }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: { requests, pagination: paginationMeta(total, page, limit) },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
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

  const parsed = enrollmentReviewSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the decision details.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const requestRecord = await db.enrollmentRequest.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
      classLevel: true,
      user: { select: { fullName: true, email: true, studentId: true } },
      course: { select: { title: true, slug: true } },
    },
  });
  if (!requestRecord) return errorResponse("Enrollment request not found.", 404);
  if (!["PENDING", "REVIEWING"].includes(requestRecord.status)) {
    return errorResponse(
      `This request is already ${requestRecord.status.toLowerCase()} and cannot be reviewed again.`,
      409,
    );
  }

  if (parsed.data.action === "REVIEWING") {
    const claimed = await db.enrollmentRequest.updateMany({
      where: { id: requestRecord.id, status: "PENDING" },
      data: {
        status: "REVIEWING",
        reviewedById: user.id,
        reviewNote: parsed.data.reviewNote,
        reviewedAt: null,
      },
    });
    if (claimed.count === 0) {
      return errorResponse(
        "This payment request is already being reviewed. Refresh to see the latest reviewer.",
        409,
      );
    }

    const updatedRequest = await db.enrollmentRequest.findUniqueOrThrow({
      where: { id: requestRecord.id },
      include: enrollmentRequestDetailInclude,
    });
    return NextResponse.json({ success: true, data: updatedRequest });
  }

  if (parsed.data.action === "APPROVE") {
    const enrolledAt = new Date();
    const result = await db.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: requestRecord.userId,
            courseId: requestRecord.courseId,
          },
        },
        update: {
          status: "ACTIVE",
          source: "MANUAL_PAYMENT",
          grantedById: user.id,
          grantNote: parsed.data.reviewNote,
          grantedAt: enrolledAt,
          enrolledAt,
          expiresAt: null,
          completedAt: null,
        },
        create: {
          userId: requestRecord.userId,
          courseId: requestRecord.courseId,
          status: "ACTIVE",
          source: "MANUAL_PAYMENT",
          grantedById: user.id,
          grantNote: parsed.data.reviewNote,
          grantedAt: enrolledAt,
        },
      });

      const studentId = await ensureStudentId(tx, requestRecord.userId, enrolledAt);

      await tx.user.update({
        where: { id: requestRecord.userId },
        data: {
          classLevel: requestRecord.classLevel,
        },
      });

      const enrollmentRequest = await tx.enrollmentRequest.update({
        where: { id: requestRecord.id },
        data: {
          status: "APPROVED",
          reviewedById: user.id,
          reviewNote: parsed.data.reviewNote,
          reviewedAt: enrolledAt,
        },
      });
      return { enrollment, enrollmentRequest, studentId };
    });
    void sendEnrollmentDecisionEmail({
      studentName: requestRecord.user.fullName,
      studentEmail: requestRecord.user.email,
      courseTitle: requestRecord.course.title,
      courseSlug: requestRecord.course.slug,
      approved: true,
      reviewNote: parsed.data.reviewNote,
    }).catch(() => undefined);

    void createUserNotification({
      userId: requestRecord.userId,
      title: "Enrollment approved",
      content: `Your payment for "${requestRecord.course.title}" was verified. You can start learning now.`,
      type: "ENROLLMENT_APPROVED",
      category: "ALERT",
      link: `/learn/${requestRecord.course.slug}`,
    }).catch(() => undefined);

    if (!requestRecord.user.studentId && result.studentId) {
      void createUserNotification({
        userId: requestRecord.userId,
        title: "Your student ID is ready",
        content: `Your Broad Academy student ID is ${result.studentId}. Find it anytime in your dashboard profile.`,
        type: "STUDENT_ID_ASSIGNED",
        category: "UPDATE",
        link: "/dashboard?tab=profile",
      }).catch(() => undefined);
    }

    const updatedRequest = await db.enrollmentRequest.findUniqueOrThrow({
      where: { id: requestRecord.id },
      include: enrollmentRequestDetailInclude,
    });
    return NextResponse.json({
      success: true,
      data: updatedRequest,
      enrollment: result.enrollment,
    });
  }

  const result = await db.enrollmentRequest.update({
    where: { id: requestRecord.id },
    data: {
      status: "REJECTED",
      reviewedById: user.id,
      reviewNote: parsed.data.reviewNote,
      reviewedAt: new Date(),
    },
  });
  void sendEnrollmentDecisionEmail({
    studentName: requestRecord.user.fullName,
    studentEmail: requestRecord.user.email,
    courseTitle: requestRecord.course.title,
    courseSlug: requestRecord.course.slug,
    approved: false,
    reviewNote: parsed.data.reviewNote,
  }).catch(() => undefined);

  const rejectionNote = parsed.data.reviewNote?.trim();
  void createUserNotification({
    userId: requestRecord.userId,
    title: "Enrollment not approved",
    content: rejectionNote
      ? `Your enrollment for "${requestRecord.course.title}" was not approved. Note: ${rejectionNote}`
      : `Your enrollment for "${requestRecord.course.title}" was not approved. You can review and resubmit.`,
    type: "ENROLLMENT_REJECTED",
    category: "ALERT",
    link: `/courses/${requestRecord.course.slug}`,
  }).catch(() => undefined);

  const updatedRequest = await db.enrollmentRequest.findUniqueOrThrow({
    where: { id: result.id },
    include: enrollmentRequestDetailInclude,
  });
  return NextResponse.json({ success: true, data: updatedRequest });
}
