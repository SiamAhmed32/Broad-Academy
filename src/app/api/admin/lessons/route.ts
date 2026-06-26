import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import {
  lessonCreateErrorMessage,
  nextLessonDisplayOrder,
  resolveUniqueLessonSlug,
} from "@/lib/admin/lesson-create";
import { adminLessonPatchSchema, adminLessonSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import {
  syncCourseContentStats,
  syncCourseStatsForLesson,
} from "@/lib/courses/sync-course-stats";

export const runtime = "nodejs";

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

  const parsed = adminLessonSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid lesson.", 422, parsed.error.flatten().fieldErrors);
  }
  if (parsed.data.type === "VIDEO" && !parsed.data.youtubeVideoId) {
    return errorResponse("A valid YouTube link is required for video lessons.", 422);
  }

  try {
    const courseModule = await db.courseModule.findUnique({
      where: { id: parsed.data.moduleId },
      select: { id: true },
    });
    if (!courseModule) {
      return errorResponse("The selected course section could not be found.", 404);
    }

    const slug = await resolveUniqueLessonSlug(
      parsed.data.moduleId,
      parsed.data.title,
      parsed.data.slug,
    );
    const displayOrder =
      parsed.data.displayOrder ?? (await nextLessonDisplayOrder(parsed.data.moduleId));

    const lesson = await db.lesson.create({
      data: {
        moduleId: parsed.data.moduleId,
        slug,
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        youtubeVideoId: parsed.data.youtubeVideoId ?? null,
        durationSeconds: parsed.data.durationSeconds,
        content: parsed.data.content ?? null,
        displayOrder,
        isPreview: parsed.data.isPreview,
      },
    });

    await syncCourseStatsForLesson(lesson.id);

    return NextResponse.json({ success: true, data: lesson }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/lessons failed:", error);
    return errorResponse(lessonCreateErrorMessage(error), 500);
  }
}

export async function PATCH(request: NextRequest) {
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

  const parsed = adminLessonPatchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid lesson.", 422);

  const { id, ...data } = parsed.data;
  if (data.type === "VIDEO" && !data.youtubeVideoId) {
    return errorResponse("A valid YouTube link is required for video lessons.", 422);
  }

  try {
    const existing = await db.lesson.findUnique({
      where: { id },
      select: { moduleId: true, slug: true, title: true },
    });
    if (!existing) return errorResponse("Lesson not found.", 404);

    const nextSlug =
      data.slug ??
      (data.title && data.title !== existing.title
        ? await resolveUniqueLessonSlug(existing.moduleId, data.title)
        : undefined);

    const lesson = await db.lesson.update({
      where: { id },
      data: {
        ...data,
        ...(nextSlug ? { slug: nextSlug } : {}),
      },
    });
    await syncCourseStatsForLesson(lesson.id);
    return NextResponse.json({ success: true, data: lesson });
  } catch (error) {
    console.error("PATCH /api/admin/lessons failed:", error);
    return errorResponse(lessonCreateErrorMessage(error), 500);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTENT);
  if (error) return error;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return errorResponse("Lesson id required.", 400);

  const lesson = await db.lesson.findUnique({
    where: { id },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) return errorResponse("Lesson not found.", 404);

  await db.lesson.delete({ where: { id } });
  await syncCourseContentStats(lesson.module.courseId);
  return NextResponse.json({ success: true });
}
