import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { adminLessonResourceSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTENT);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminLessonResourceSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Invalid resource.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const lesson = await db.lesson.findUnique({ where: { id: parsed.data.lessonId } });
  if (!lesson) {
    return errorResponse("Lesson not found.", 404);
  }

  const count = await db.lessonResource.count({
    where: { lessonId: parsed.data.lessonId },
  });

  const resource = await db.lessonResource.create({
    data: {
      lessonId: parsed.data.lessonId,
      title: parsed.data.title,
      url: parsed.data.url,
      displayOrder: count,
    },
  });

  return NextResponse.json({ success: true, data: resource }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTENT);
  if (error) return error;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return errorResponse("Resource id required.", 400);

  await db.lessonResource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
