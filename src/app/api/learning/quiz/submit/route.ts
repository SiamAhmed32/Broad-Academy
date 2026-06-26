import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { getCurrentUser } from "@/lib/auth/session";
import {
  checkRateLimit,
  clearRateLimit,
  hashValue,
  isTrustedOrigin,
} from "@/lib/auth/security";
import { db } from "@/lib/db";
import { quizSubmissionSchema } from "@/lib/learning/validation";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }
  if (Number(request.headers.get("content-length") || 0) > 30_000) {
    return errorResponse("Request is too large.", 413);
  }

  const user = await getCurrentUser();
  if (!user) return errorResponse("Authentication required.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = quizSubmissionSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid quiz submission.", 422);

  const rateKey = hashValue(`quiz:${user.id}:${parsed.data.quizId}`);
  const rateLimit = await checkRateLimit(rateKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: "Please wait before submitting again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const quiz = await db.quiz.findFirst({
    where: {
      id: parsed.data.quizId,
      lesson: {
        module: {
          course: {
            enrollments: {
              some: {
                userId: user.id,
                status: "ACTIVE",
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      lessonId: true,
      lesson: { select: { type: true } },
      passPercent: true,
      timeLimitSeconds: true,
      questions: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          explanation: true,
          options: {
            select: { id: true, isCorrect: true },
          },
        },
      },
    },
  });

  if (!quiz) return errorResponse("You cannot access this quiz.", 403);

  if (quiz.timeLimitSeconds && parsed.data.startedAt) {
    const startedAt = new Date(parsed.data.startedAt).getTime();
    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    if (elapsedSeconds > quiz.timeLimitSeconds + 30) {
      return errorResponse("Time limit exceeded for this exam.", 403);
    }
  }

  let score = 0;
  const review = quiz.questions.map((question) => {
    const selected = new Set(parsed.data.answers[question.id] ?? []);
    const validOptionIds = new Set(question.options.map((option) => option.id));
    const correctIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id);
    const containsInvalidOption = [...selected].some((id) => !validOptionIds.has(id));
    const correct =
      !containsInvalidOption &&
      selected.size === correctIds.length &&
      correctIds.every((id) => selected.has(id));
    if (correct) score += 1;
    return {
      questionId: question.id,
      selectedOptionIds: [...selected].filter((id) => validOptionIds.has(id)),
      correctOptionIds: correctIds,
      correct,
      explanation: question.explanation,
    };
  });

  const total = quiz.questions.length;
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= quiz.passPercent;

  await db.$transaction([
    db.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        score,
        total,
        percentage,
        passed,
        answers: parsed.data.answers,
      },
    }),
    ...(passed && quiz.lesson.type === "QUIZ"
      ? [
          db.lessonProgress.upsert({
            where: {
              userId_lessonId: { userId: user.id, lessonId: quiz.lessonId },
            },
            update: { completed: true, completedAt: new Date() },
            create: {
              userId: user.id,
              lessonId: quiz.lessonId,
              completed: true,
              completedAt: new Date(),
            },
          }),
        ]
      : []),
  ]);

  await clearRateLimit(rateKey);

  return NextResponse.json(
    {
      success: true,
      data: { score, total, percentage, passed, review },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
