import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "STUDENT") {
    return errorResponse("Sign in with a student account to take exams.", 401);
  }

  const exam = await db.exam.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      price: true,
      durationMinutes: true,
      totalMarks: true,
      negativeMarking: true,
      startsAt: true,
      endsAt: true,
    },
  });

  if (!exam) return errorResponse("Exam not found.", 404);

  const now = new Date();
  if (now < exam.startsAt) {
    return errorResponse("This exam has not started yet.", 403);
  }
  if (now > exam.endsAt) {
    return errorResponse("This exam has ended.", 403);
  }

  // Check access
  const isFree = exam.price === 0;
  if (!isFree) {
    const enrollment = await db.examEnrollment.findUnique({
      where: { userId_examId: { userId: user.id, examId: exam.id } },
      select: { status: true },
    });
    if (enrollment?.status !== "ACTIVE") {
      return errorResponse("You do not have access to this exam.", 403);
    }
  }

  const questions = await db.examQuestion.findMany({
    where: { examId: exam.id },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      prompt: true,
      imageUrl: true,
      displayOrder: true,
      options: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          text: true,
          displayOrder: true,
          // isCorrect is intentionally excluded from student-facing API
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      questions,
      exam: {
        id: exam.id,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        negativeMarking: exam.negativeMarking,
      },
    },
  });
}
