import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { slugify } from "@/lib/admin/utils";
import { adminCourseSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { isManagedCloudinaryImage } from "@/lib/media/images";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.COURSES);
  if (error) return error;

  const { id } = await context.params;
  const course = await db.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { displayOrder: "asc" },
        include: {
          lessons: {
            orderBy: { displayOrder: "asc" },
            include: { quiz: { select: { id: true, title: true } } },
          },
        },
      },
    },
  });

  if (!course) return errorResponse("Course not found.", 404);
  return NextResponse.json(
    { success: true, message: "Course updated successfully.", data: course },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.COURSES);
  if (error) return error;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminCourseSchema.partial().safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid course data.", 422, parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;
  const existing = await db.course.findUnique({ where: { id } });
  if (!existing) return errorResponse("Course not found.", 404);

  if (
    data.thumbnailUrl !== undefined &&
    data.thumbnailUrl !== existing.thumbnailUrl &&
    !isManagedCloudinaryImage(data.thumbnailUrl)
  ) {
    return errorResponse("Use the secure image uploader to replace the thumbnail.", 422, {
      thumbnailUrl: ["Uploaded course images must use managed storage."],
    });
  }

  const nextSlug =
    data.slug ?? (data.title ? slugify(data.title) : undefined);

  if (nextSlug && nextSlug !== existing.slug) {
    const taken = await db.course.findUnique({ where: { slug: nextSlug } });
    if (taken) return errorResponse("Slug already in use.", 409);
  }

  const course = await db.course.update({
    where: { id },
    data: {
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.shortDescription !== undefined
        ? { shortDescription: data.shortDescription }
        : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.subject !== undefined ? { subject: data.subject } : {}),
      ...(data.instructorName !== undefined
        ? { instructorName: data.instructorName }
        : {}),
      ...(data.thumbnailUrl !== undefined ? { thumbnailUrl: data.thumbnailUrl } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.originalPrice !== undefined
        ? { originalPrice: data.originalPrice }
        : {}),
      ...(data.durationMinutes !== undefined
        ? { durationMinutes: data.durationMinutes }
        : {}),
      ...(data.lessonCount !== undefined ? { lessonCount: data.lessonCount } : {}),
      ...(data.featured !== undefined ? { featured: data.featured } : {}),
      ...(data.homepageOrder !== undefined
        ? { homepageOrder: data.homepageOrder }
        : {}),
      ...(data.badge !== undefined ? { badge: data.badge } : {}),
      ...(data.status !== undefined
        ? {
            status: data.status,
            publishedAt:
              data.status === "PUBLISHED"
                ? existing.publishedAt ?? new Date()
                : data.status === "DRAFT"
                  ? null
                  : existing.publishedAt,
          }
        : {}),
    },
  });

  return NextResponse.json({ success: true, data: course });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.COURSES);
  if (error) return error;

  const { id } = await context.params;
  await db.course.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Course deleted." });
}
