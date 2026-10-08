import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { courseAccessError } from "@/lib/admin/course-scope";
import { requireStaffApi } from "@/lib/admin/guard";
import { slugify } from "@/lib/admin/utils";
import { adminCourseSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { isManagedCloudinaryImage } from "@/lib/media/images";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.COURSES_VIEW);
  if (error || !user) return error!;

  const { id } = await context.params;
  const denied = await courseAccessError(user, id);
  if (denied) return denied;
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

  // Zod 4 still fills `.default()` values inside `.partial()`, so a status-only
  // PATCH (archive / restore) or the edit form (which leaves out the
  // auto-calculated lessonCount) would silently reset featured, homepageOrder,
  // examCount and lessonCount. Only apply the fields the client actually sent.
  const sentKeys = new Set(
    body && typeof body === "object" ? Object.keys(body) : [],
  );
  const data = Object.fromEntries(
    Object.entries(parsed.data).filter(([key]) => sentKeys.has(key)),
  ) as typeof parsed.data;
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
      ...(data.examCount !== undefined ? { examCount: data.examCount } : {}),
      ...(data.featured !== undefined ? { featured: data.featured } : {}),
      ...(data.homepageOrder !== undefined
        ? { homepageOrder: data.homepageOrder }
        : {}),
      ...(data.badge !== undefined ? { badge: data.badge } : {}),
      ...(data.description !== undefined
        ? { description: data.description || null }
        : {}),
      ...(data.includes !== undefined ? { includes: data.includes } : {}),
      ...(data.facebookGroupUrl !== undefined
        ? { facebookGroupUrl: data.facebookGroupUrl || null }
        : {}),
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

  // Expire immediately so the public pages reflect the edit on the next visit.
  revalidateTag("courses", { expire: 0 });

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
  revalidateTag("courses", { expire: 0 });
  return NextResponse.json({ success: true, message: "Course deleted." });
}
