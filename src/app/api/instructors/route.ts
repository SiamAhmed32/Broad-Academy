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
import { fetchInstructorsList } from "@/lib/instructors/fetch";
import { getInstructorSeedData } from "@/lib/instructors/seed-data";
import { emptyToNull, slugify } from "@/lib/instructors/utils";
import {
  createInstructorSchema,
  instructorListQuerySchema,
} from "@/lib/instructors/validation";
import { isManagedCloudinaryImage } from "@/lib/media/images";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = instructorListQuerySchema.safeParse(params);

  if (!parsed.success) {
    return errorResponse("Invalid query parameters.", 422);
  }

  const data = await fetchInstructorsList(parsed.data);

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

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user: admin, error: authError } = await requireStaffApi(
    ADMIN_PERMISSIONS.INSTRUCTORS,
  );
  if (authError || !admin) return authError!;

  if (Number(request.headers.get("content-length") || 0) > 16_000) {
    return errorResponse("Request is too large.", 413);
  }

  const ipHash = hashValue(getClientIp(request));
  const rateKey = hashValue(`instructor-create:${ipHash}:${admin.id}`);
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

  const parsed = createInstructorSchema.safeParse(body);
  if (!parsed.success) {
    await recordFailedAttempt(rateKey);
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const data = parsed.data;
  if (
    !isManagedCloudinaryImage(data.avatarUrl) ||
    (data.coverUrl && !isManagedCloudinaryImage(data.coverUrl))
  ) {
    return errorResponse("Use the secure image uploader for instructor photos.", 422);
  }

  const slug = data.slug ?? slugify(data.fullName);

  const existing = await db.instructor.findUnique({ where: { slug } });
  if (existing) {
    await recordFailedAttempt(rateKey);
    return errorResponse("An instructor with this slug already exists.", 409);
  }

  const instructor = await db.instructor.create({
    data: {
      slug,
      fullName: data.fullName,
      title: data.title,
      shortBio: data.shortBio,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      coverUrl: emptyToNull(data.coverUrl),
      specialty: data.specialty,
      subjects: data.subjects,
      expertise: data.expertise,
      experienceYears: data.experienceYears,
      studentsCount: data.studentsCount,
      coursesCount: data.coursesCount,
      rating: data.rating,
      reviewCount: data.reviewCount,
      featured: data.featured,
      displayOrder: data.displayOrder,
      status: data.status,
      linkedIn: emptyToNull(data.linkedIn),
      twitter: emptyToNull(data.twitter),
      website: emptyToNull(data.website),
    },
  });

  return NextResponse.json(
    { success: true, message: "Instructor created.", data: instructor },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return errorResponse("Seeding is disabled in production.", 403);
  }

  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user: admin, error: authError } = await requireStaffApi(
    ADMIN_PERMISSIONS.INSTRUCTORS,
  );
  if (authError || !admin) return authError!;

  const seedData = getInstructorSeedData();

  await db.instructor.deleteMany();

  for (const instructor of seedData) {
    await db.instructor.create({
      data: {
        slug: instructor.slug,
        fullName: instructor.fullName,
        title: instructor.title,
        shortBio: instructor.shortBio,
        bio: instructor.bio,
        avatarUrl: instructor.avatarUrl,
        coverUrl: emptyToNull(instructor.coverUrl),
        specialty: instructor.specialty,
        subjects: instructor.subjects,
        expertise: instructor.expertise,
        experienceYears: instructor.experienceYears,
        studentsCount: instructor.studentsCount,
        coursesCount: instructor.coursesCount,
        rating: instructor.rating,
        reviewCount: instructor.reviewCount,
        featured: instructor.featured,
        displayOrder: instructor.displayOrder,
        status: instructor.status,
        linkedIn: emptyToNull(instructor.linkedIn),
        twitter: emptyToNull(instructor.twitter),
        website: emptyToNull(instructor.website),
      },
    });
  }

  const count = await db.instructor.count();

  return NextResponse.json(
    {
      success: true,
      message: `Seeded ${count} instructors.`,
      data: { count },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
