import { NextRequest, NextResponse } from "next/server";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const exam = await db.exam.findUnique({
    where: { id },
  });

  if (!exam) return errorResponse("Exam not found.", 404);

  return NextResponse.json({ success: true, data: exam });
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
  if (data.bannerUrl && !isManagedCloudinaryImage(data.bannerUrl)) {
    return errorResponse("Upload the exam banner image before saving.", 422, {
      bannerUrl: ["Exam banners must use the secure image uploader."],
    });
  }

  const existingExam = await db.exam.findUnique({ where: { id } });
  if (!existingExam) return errorResponse("Exam not found.", 404);

  const slug = data.slug ?? slugify(data.title);

  const duplicate = await db.exam.findFirst({
    where: {
      slug,
      id: { not: id },
    },
  });
  if (duplicate) return errorResponse("An exam with this slug already exists.", 409);

  const exam = await db.exam.update({
    where: { id },
    data: {
      slug,
      title: data.title,
      code: data.code || "EXAM",
      description: data.description ?? null,
      bannerUrl: data.bannerUrl ?? null,
      price: data.price,
      originalPrice: data.originalPrice ?? null,
      durationMinutes: data.durationMinutes,
      totalMarks: data.totalMarks,
      negativeMarking: data.negativeMarking,
      status: data.status,
      startsAt: data.startsAt ?? new Date(),
      endsAt: data.endsAt ?? DEFAULT_EXAM_END,
    },
  });

  return NextResponse.json({ success: true, data: exam });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const existingExam = await db.exam.findUnique({ where: { id } });
  if (!existingExam) return errorResponse("Exam not found.", 404);

  await db.exam.delete({ where: { id } });

  return NextResponse.json({ success: true, message: "Exam deleted successfully." });
}
