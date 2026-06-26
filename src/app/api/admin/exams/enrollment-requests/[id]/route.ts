import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { examReviewSchema } from "@/lib/exams/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { createUserNotification } from "@/lib/notifications/service";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error || !user) return error!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = examReviewSchema.safeParse({ id, ...(body as any) });
  if (!parsed.success) {
    return errorResponse(
      "Please review the review decision details.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const requestRecord = await db.examEnrollmentRequest.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      examId: true,
      status: true,
      classLevel: true,
      exam: { select: { title: true, slug: true } },
    },
  });

  if (!requestRecord) return errorResponse("Enrollment request not found.", 404);
  if (requestRecord.status !== "PENDING") {
    return errorResponse(
      `This request is already ${requestRecord.status.toLowerCase()} and cannot be reviewed again.`,
      409,
    );
  }

  const decisionTime = new Date();

  if (parsed.data.action === "APPROVE") {
    await db.$transaction(async (tx) => {
      // Create/Update Exam Enrollment
      await tx.examEnrollment.upsert({
        where: {
          userId_examId: {
            userId: requestRecord.userId,
            examId: requestRecord.examId,
          },
        },
        update: {
          status: "ACTIVE",
          enrolledAt: decisionTime,
        },
        create: {
          userId: requestRecord.userId,
          examId: requestRecord.examId,
          status: "ACTIVE",
          enrolledAt: decisionTime,
        },
      });

      // Update student class level if present in request
      if (requestRecord.classLevel) {
        await tx.user.update({
          where: { id: requestRecord.userId },
          data: { classLevel: requestRecord.classLevel },
        });
      }

      // Mark request APPROVED
      await tx.examEnrollmentRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: user.id,
          reviewNote: parsed.data.reviewNote,
          reviewedAt: decisionTime,
        },
      });
    });

    // Notify student
    void createUserNotification({
      userId: requestRecord.userId,
      title: "Exam enrollment request approved",
      content: `Your payment proof for "${requestRecord.exam.title}" has been verified. You can now take the exam.`,
      type: "EXAM_ENROLLED",
      category: "OFFER",
      link: `/exams/${requestRecord.exam.slug}`,
    }).catch(() => undefined);

    return NextResponse.json({
      success: true,
      message: "Enrollment request approved successfully.",
    });
  }

  if (parsed.data.action === "REJECT") {
    await db.examEnrollmentRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: user.id,
        reviewNote: parsed.data.reviewNote,
        reviewedAt: decisionTime,
      },
    });

    // Notify student
    void createUserNotification({
      userId: requestRecord.userId,
      title: "Exam enrollment request rejected",
      content: `Your payment proof for "${requestRecord.exam.title}" was rejected: ${parsed.data.reviewNote ?? "Invalid payment detail."}`,
      type: "EXAM_REJECTED",
      category: "ALERT",
      link: `/exams/${requestRecord.exam.slug}`,
    }).catch(() => undefined);

    return NextResponse.json({
      success: true,
      message: "Enrollment request rejected successfully.",
    });
  }

  return errorResponse("Invalid action.", 400);
}
