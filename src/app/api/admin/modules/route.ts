import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { adminModuleSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { syncCourseContentStats } from "@/lib/courses/sync-course-stats";

const patchSchema = adminModuleSchema
  .omit({ courseId: true })
  .partial()
  .extend({ id: z.string().min(1) });

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

  const parsed = adminModuleSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid module.", 422, parsed.error.flatten().fieldErrors);
  }

  const count = await db.courseModule.count({
    where: { courseId: parsed.data.courseId },
  });

  const module = await db.courseModule.create({
    data: {
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      displayOrder: parsed.data.displayOrder ?? count,
    },
  });

  await syncCourseContentStats(parsed.data.courseId);

  return NextResponse.json({ success: true, data: module }, { status: 201 });
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid module.", 422);

  const { id, ...data } = parsed.data;
  const existing = await db.courseModule.findUnique({
    where: { id },
    select: { courseId: true },
  });
  if (!existing) return errorResponse("Module not found.", 404);

  const module = await db.courseModule.update({ where: { id }, data });
  await syncCourseContentStats(existing.courseId);
  return NextResponse.json({ success: true, data: module });
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTENT);
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return errorResponse("Module id required.", 400);

  const existing = await db.courseModule.findUnique({
    where: { id },
    select: { courseId: true },
  });
  if (!existing) return errorResponse("Module not found.", 404);

  await db.courseModule.delete({ where: { id } });
  await syncCourseContentStats(existing.courseId);
  return NextResponse.json({ success: true });
}
