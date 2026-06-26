import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; attemptId: string }> },
) {
  const { slug, attemptId } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "STUDENT") {
    return errorResponse("Authentication required.", 401);
  }

  const exam = await db.exam.findFirst({
    where: { slug },
    select: { id: true, title: true, totalMarks: true, negativeMarking: true },
  });

  if (!exam) return errorResponse("Exam not found.", 404);

  const attempt = await db.examAttempt.findFirst({
    where: { id: attemptId, examId: exam.id, userId: user.id },
    select: {
      id: true,
      score: true,
      total: true,
      correctQty: true,
      wrongQty: true,
      skippedQty: true,
      timeTakenSec: true,
      answers: true,
      submittedAt: true,
    },
  });

  if (!attempt) return errorResponse("Attempt not found.", 404);

  // Load full questions with correct answers and explanations for result view
  const questions = await db.examQuestion.findMany({
    where: { examId: exam.id },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      prompt: true,
      imageUrl: true,
      explanation: true,
      displayOrder: true,
      options: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          text: true,
          isCorrect: true,
          displayOrder: true,
        },
      },
    },
  });

  // Load leaderboard rank
  const allAttempts = await db.examAttempt.findMany({
    where: { examId: exam.id },
    orderBy: [{ score: "desc" }, { timeTakenSec: "asc" }],
    select: { userId: true },
  });

  const rank = allAttempts.findIndex((a) => a.userId === user.id) + 1;

  return NextResponse.json({
    success: true,
    data: {
      exam: {
        id: exam.id,
        title: exam.title,
        totalMarks: exam.totalMarks,
        negativeMarking: exam.negativeMarking,
      },
      attempt: {
        ...attempt,
        submittedAt: attempt.submittedAt.toISOString(),
      },
      questions,
      rank,
      totalParticipants: allAttempts.length,
    },
  });
}
