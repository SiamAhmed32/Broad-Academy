import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const exam = await db.exam.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      _count: { select: { questions: true } },
    },
  });

  if (!exam) return errorResponse("Exam not found.", 404);

  // If user is guest, return basic public info
  if (!user) {
    return NextResponse.json({
      success: true,
      data: {
        exam,
        authenticated: false,
        hasAccess: false,
        enrollmentStatus: null,
        request: null,
        attempts: [],
        bkashNumber: process.env.BKASH_PAYMENT_NUMBER?.trim() || null,
        paymentConfigured: Boolean(process.env.BKASH_PAYMENT_NUMBER?.trim()),
      },
    }, { headers: { "Cache-Control": "no-store" } });
  }

  // User is authenticated student, resolve access & history
  const [enrollment, enrollmentRequest, attempts] = await Promise.all([
    db.examEnrollment.findUnique({
      where: {
        userId_examId: { userId: user.id, examId: exam.id },
      },
    }),
    db.examEnrollmentRequest.findUnique({
      where: {
        userId_examId: { userId: user.id, examId: exam.id },
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reviewNote: true,
      },
    }),
    db.examAttempt.findMany({
      where: { userId: user.id, examId: exam.id },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        score: true,
        total: true,
        correctQty: true,
        wrongQty: true,
        skippedQty: true,
        timeTakenSec: true,
        submittedAt: true,
      },
    }),
  ]);

  const isFree = exam.price === 0;
  const hasAccess = isFree || enrollment?.status === "ACTIVE";

  return NextResponse.json({
    success: true,
    data: {
      exam,
      authenticated: true,
      hasAccess,
      enrollmentStatus: enrollment?.status ?? null,
      request: enrollmentRequest
        ? {
            ...enrollmentRequest,
            submittedAt: enrollmentRequest.submittedAt.toISOString(),
          }
        : null,
      attempts: attempts.map((a) => ({
        ...a,
        submittedAt: a.submittedAt.toISOString(),
      })),
      bkashNumber: process.env.BKASH_PAYMENT_NUMBER?.trim() || null,
      paymentConfigured: Boolean(process.env.BKASH_PAYMENT_NUMBER?.trim()),
      profilePhone: user.phone,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
