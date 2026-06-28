import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { slugify } from "@/lib/admin/utils";
import { adminExamSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { isManagedCloudinaryImage } from "@/lib/media/images";

export const runtime = "nodejs";

const DEFAULT_EXAM_END = new Date("2099-12-31T23:59:59.000Z");

type RouteContext = { params: Promise<{ id: string }> };

function examSaveErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "An exam with this slug already exists.";
    }
    if (error.code === "P2025") {
      return "Exam not found.";
    }
  }

  return "Could not save the exam. Please try again.";
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const { id } = await context.params;
  const exam = await db.exam.findUnique({
    where: { id },
  });

  if (!exam) return errorResponse("Exam not found.", 404);

  return NextResponse.json({ success: true, data: exam });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminExamSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid exam data.", 422, parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;
  const existingExam = await db.exam.findUnique({ where: { id } });
  if (!existingExam) return errorResponse("Exam not found.", 404);

  const nextBannerUrl = data.bannerUrl?.trim() || null;
  if (
    nextBannerUrl &&
    nextBannerUrl !== existingExam.bannerUrl &&
    !isManagedCloudinaryImage(nextBannerUrl)
  ) {
    return errorResponse("Upload the exam banner image before saving.", 422, {
      bannerUrl: ["Exam banners must use the secure image uploader."],
    });
  }

  const slug = data.slug ?? slugify(data.title);

  const duplicate = await db.exam.findFirst({
    where: {
      slug,
      id: { not: id },
    },
  });
  if (duplicate) return errorResponse("An exam with this slug already exists.", 409);

  try {
    const exam = await db.exam.update({
      where: { id },
      data: {
        slug,
        title: data.title,
        code: data.code || "EXAM",
        description: data.description?.trim() || null,
        bannerUrl: nextBannerUrl,
        price: data.price,
        originalPrice: data.originalPrice ?? null,
        durationMinutes: data.durationMinutes,
        totalMarks: data.totalMarks,
        negativeMarking: data.negativeMarking,
        status: data.status,
        startsAt: data.startsAt ?? existingExam.startsAt,
        endsAt: data.endsAt ?? existingExam.endsAt,
      },
    });

    return NextResponse.json({ success: true, data: exam });
  } catch (updateError) {
    console.error("PUT /api/admin/exams/[id] failed:", updateError);
    return errorResponse(examSaveErrorMessage(updateError), 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const { id } = await context.params;

  const existingExam = await db.exam.findUnique({ where: { id } });
  if (!existingExam) return errorResponse("Exam not found.", 404);

  await db.exam.delete({ where: { id } });

  return NextResponse.json({ success: true, message: "Exam deleted successfully." });
}
