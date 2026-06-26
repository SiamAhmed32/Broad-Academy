import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  checkRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
} from "@/lib/auth/security";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";
import { examSubmitAnswersSchema } from "@/lib/exams/validation";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return errorResponse("Sign in with a student account to submit exams.", 401);
  }

  const rateKey = hashValue(`exam-submit:${user.id}:${hashValue(getClientIp(request))}`);
  const rateLimit = await checkRateLimit(rateKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many submission attempts. Please wait." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const parsed = examSubmitAnswersSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid submission data.", 422, parsed.error.flatten().fieldErrors);
  }

  const exam = await db.exam.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      price: true,
      totalMarks: true,
      negativeMarking: true,
      durationMinutes: true,
      startsAt: true,
      endsAt: true,
      questions: {
        select: {
          id: true,
          options: {
            where: { isCorrect: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!exam) return errorResponse("Exam not found.", 404);

  const now = new Date();
  if (now < exam.startsAt) {
    return errorResponse("This exam has not started yet.", 403);
  }
  if (now > new Date(exam.endsAt.getTime() + 5 * 60 * 1000)) {
    // 5 min grace period after end
    return errorResponse("Submission window has closed.", 403);
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

  // Grade the exam
  const { answers, timeTakenSec } = parsed.data;

  let correctQty = 0;
  let wrongQty = 0;
  let skippedQty = 0;

  for (const question of exam.questions) {
    const givenAnswer = answers[question.id];
    if (!givenAnswer) {
      skippedQty++;
      continue;
    }
    const correctOptionId = question.options[0]?.id;
    if (correctOptionId && givenAnswer === correctOptionId) {
      correctQty++;
    } else {
      wrongQty++;
    }
  }

  const marksPerQuestion = exam.totalMarks / Math.max(exam.questions.length, 1);
  const positiveScore = correctQty * marksPerQuestion;
  const negativeScore = wrongQty * exam.negativeMarking;
  const score = Math.max(0, positiveScore - negativeScore);

  const attempt = await db.examAttempt.create({
    data: {
      userId: user.id,
      examId: exam.id,
      score: parseFloat(score.toFixed(2)),
      total: exam.totalMarks,
      correctQty,
      wrongQty,
      skippedQty,
      timeTakenSec,
      answers: answers as Record<string, string | null>,
    },
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
  });

  return NextResponse.json({
    success: true,
    message: "Exam submitted successfully.",
    data: {
      ...attempt,
      submittedAt: attempt.submittedAt.toISOString(),
      slug,
    },
  });
}
