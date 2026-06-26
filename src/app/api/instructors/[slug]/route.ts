import { NextRequest, NextResponse } from "next/server";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import {
  checkRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
  recordFailedAttempt,
} from "@/lib/auth/security";
import { db } from "@/lib/db";
import { fetchInstructorBySlug } from "@/lib/instructors/fetch";
import { emptyToNull, slugify } from "@/lib/instructors/utils";
import { updateInstructorSchema } from "@/lib/instructors/validation";
import { isManagedCloudinaryImage } from "@/lib/media/images";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  if (!slug || slug.length > 80) {
    return errorResponse("Instructor not found.", 404);
  }

  const data = await fetchInstructorBySlug(slug);

  if (!data) return errorResponse("Instructor not found.", 404);

  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user: admin, error: authError } = await requireStaffApi(
    ADMIN_PERMISSIONS.INSTRUCTORS,
  );
  if (authError || !admin) return authError!;

  const { slug } = await context.params;

  if (Number(request.headers.get("content-length") || 0) > 16_000) {
    return errorResponse("Request is too large.", 413);
  }

  const ipHash = hashValue(getClientIp(request));
  const rateKey = hashValue(`instructor-update:${ipHash}:${admin.id}`);
  const rateLimit = await checkRateLimit(rateKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please wait and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    await recordFailedAttempt(rateKey);
    return errorResponse("Invalid request body.");
  }

  const parsed = updateInstructorSchema.safeParse(body);
  if (!parsed.success) {
    await recordFailedAttempt(rateKey);
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const existing = await db.instructor.findUnique({ where: { slug } });
  if (!existing) {
    return errorResponse("Instructor not found.", 404);
  }

  const data = parsed.data;
  if (
    (data.avatarUrl !== undefined &&
      data.avatarUrl !== existing.avatarUrl &&
      !isManagedCloudinaryImage(data.avatarUrl)) ||
    (data.coverUrl !== undefined &&
      data.coverUrl !== (existing.coverUrl ?? "") &&
      data.coverUrl !== "" &&
      !isManagedCloudinaryImage(data.coverUrl))
  ) {
    return errorResponse("Use the secure image uploader to replace instructor photos.", 422);
  }

  const nextSlug =
    data.slug ??
    (data.fullName ? slugify(data.fullName) : undefined);

  if (nextSlug && nextSlug !== existing.slug) {
    const slugTaken = await db.instructor.findUnique({ where: { slug: nextSlug } });
    if (slugTaken) {
      await recordFailedAttempt(rateKey);
      return errorResponse("An instructor with this slug already exists.", 409);
    }
  }

  const instructor = await db.instructor.update({
    where: { id: existing.id },
    data: {
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.shortBio !== undefined ? { shortBio: data.shortBio } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      ...(data.coverUrl !== undefined ? { coverUrl: emptyToNull(data.coverUrl) } : {}),
      ...(data.specialty !== undefined ? { specialty: data.specialty } : {}),
      ...(data.subjects !== undefined ? { subjects: data.subjects } : {}),
      ...(data.expertise !== undefined ? { expertise: data.expertise } : {}),
      ...(data.experienceYears !== undefined
        ? { experienceYears: data.experienceYears }
        : {}),
      ...(data.studentsCount !== undefined
        ? { studentsCount: data.studentsCount }
        : {}),
      ...(data.coursesCount !== undefined
        ? { coursesCount: data.coursesCount }
        : {}),
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.reviewCount !== undefined ? { reviewCount: data.reviewCount } : {}),
      ...(data.featured !== undefined ? { featured: data.featured } : {}),
      ...(data.displayOrder !== undefined
        ? { displayOrder: data.displayOrder }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.linkedIn !== undefined ? { linkedIn: emptyToNull(data.linkedIn) } : {}),
      ...(data.twitter !== undefined ? { twitter: emptyToNull(data.twitter) } : {}),
      ...(data.website !== undefined ? { website: emptyToNull(data.website) } : {}),
    },
  });

  return NextResponse.json(
    { success: true, message: "Instructor updated.", data: instructor },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user: admin, error: authError } = await requireStaffApi(
    ADMIN_PERMISSIONS.INSTRUCTORS,
  );
  if (authError || !admin) return authError!;

  const { slug } = await context.params;
  const existing = await db.instructor.findUnique({ where: { slug } });

  if (!existing) {
    return errorResponse("Instructor not found.", 404);
  }

  await db.instructor.delete({ where: { id: existing.id } });

  return NextResponse.json(
    { success: true, message: "Instructor deleted." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
