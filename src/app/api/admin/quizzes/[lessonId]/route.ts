import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { adminQuizSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTENT);
  if (error) return error;

  const { lessonId } = await context.params;
  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: {
        orderBy: { displayOrder: "asc" },
        include: { options: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });

  return NextResponse.json({ success: true, data: quiz });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTENT);
  if (error) return error;

  const { lessonId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminQuizSchema.safeParse({ ...(body as object), lessonId });
  if (!parsed.success) {
    return errorResponse("Invalid quiz.", 422, parsed.error.flatten().fieldErrors);
  }

  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return errorResponse("Lesson not found.", 404);

  await db.$transaction(async (tx) => {
    const existing = await tx.quiz.findUnique({ where: { lessonId } });
    if (existing) {
      await tx.quiz.delete({ where: { id: existing.id } });
    }

    await tx.quiz.create({
      data: {
        lessonId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        passPercent: parsed.data.passPercent,
        timeLimitSeconds: parsed.data.timeLimitSeconds ?? null,
        questions: {
          create: parsed.data.questions.map((question) => ({
            prompt: question.prompt,
            explanation: question.explanation ?? null,
            displayOrder: question.displayOrder,
            options: {
              create: question.options.map((option) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                displayOrder: option.displayOrder,
              })),
            },
          })),
        },
      },
    });
  });

  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: { include: { options: true }, orderBy: { displayOrder: "asc" } },
    },
  });

  return NextResponse.json({ success: true, data: quiz });
}
