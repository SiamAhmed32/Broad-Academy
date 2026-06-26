import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { getCurrentUser } from "@/lib/auth/session";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { userCanAccessLesson } from "@/lib/learning/queries";
import { lessonProgressSchema } from "@/lib/learning/validation";

export async function PATCH(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }
  if (Number(request.headers.get("content-length") || 0) > 4_000) {
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

  const parsed = lessonProgressSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid progress update.", 422);

  const access = await userCanAccessLesson(user.id, parsed.data.lessonId);
  if (!access) return errorResponse("You are not enrolled in this course.", 403);

  const lesson = await db.lesson.findUnique({
    where: { id: parsed.data.lessonId },
    select: { durationSeconds: true, type: true },
  });
  if (!lesson) return errorResponse("Lesson not found.", 404);

  const lastPositionSec = Math.min(
    parsed.data.lastPositionSec ?? 0,
    Math.max(lesson.durationSeconds, 0),
  );
  const reportedWatchedSeconds = Math.min(
    parsed.data.watchedSeconds ?? 0,
    Math.max(lesson.durationSeconds, 0),
  );
  const existing = await db.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId: user.id, lessonId: parsed.data.lessonId },
    },
    select: { watchedSeconds: true, completed: true },
  });
  const watchedSeconds = Math.max(
    existing?.watchedSeconds ?? 0,
    reportedWatchedSeconds,
  );
  const completionThreshold = Math.max(
    1,
    Math.floor(lesson.durationSeconds * 0.9),
  );
  const completed =
    existing?.completed === true ||
    (lesson.type === "VIDEO"
      ? watchedSeconds >= completionThreshold
      : parsed.data.completed === true);

  const progress = await db.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId: user.id, lessonId: parsed.data.lessonId },
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
      watchedSeconds,
      lastPositionSec,
    },
    create: {
      userId: user.id,
      lessonId: parsed.data.lessonId,
      completed,
      completedAt: completed ? new Date() : null,
      watchedSeconds,
      lastPositionSec,
    },
    select: { completed: true, lastPositionSec: true },
  });

  return NextResponse.json(
    { success: true, data: progress },
    { headers: { "Cache-Control": "no-store" } },
  );
}
