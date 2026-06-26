import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { adminExamQuestionsListSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { isManagedCloudinaryImage } from "@/lib/media/images";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const questions = await db.examQuestion.findMany({
    where: { examId: id },
    orderBy: { displayOrder: "asc" },
    include: {
      options: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  return NextResponse.json({ success: true, data: questions });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const exam = await db.exam.findUnique({ where: { id } });
  if (!exam) return errorResponse("Exam not found.", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminExamQuestionsListSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid questions data.", 422, parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;

  // Validate images if present
  for (const q of data.questions) {
    if (q.imageUrl && !isManagedCloudinaryImage(q.imageUrl)) {
      return errorResponse("Question images must use secure image uploader storage.", 422);
    }
  }

  // Execute bulk replacement in transaction
  const savedQuestions = await db.$transaction(async (tx) => {
    // Delete existing
    await tx.examQuestion.deleteMany({ where: { examId: id } });

    // Create new
    const created = [];
    for (const q of data.questions) {
      const savedQ = await tx.examQuestion.create({
        data: {
          examId: id,
          prompt: q.prompt,
          imageUrl: q.imageUrl ?? null,
          explanation: q.explanation ?? null,
          displayOrder: q.displayOrder,
          options: {
            create: q.options.map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              displayOrder: opt.displayOrder,
            })),
          },
        },
        include: {
          options: true,
        },
      });
      created.push(savedQ);
    }
    return created;
  });

  return NextResponse.json({
    success: true,
    message: "Questions saved successfully.",
    data: savedQuestions,
  });
}
