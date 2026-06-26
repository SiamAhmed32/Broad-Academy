import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta, slugify } from "@/lib/admin/utils";
import { adminCourseSchema, adminListQuerySchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { isManagedCloudinaryImage } from "@/lib/media/images";

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.COURSES);
  if (error) return error;

  const parsed = adminListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, status, page, limit, compact } = parsed.data;
  const where = {
    ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  let orderBy: Prisma.CourseOrderByWithRelationInput[] = [{ updatedAt: "desc" }];
  const sort = parsed.data.sort;
  if (sort === "newest") orderBy = [{ createdAt: "desc" }];
  else if (sort === "oldest") orderBy = [{ createdAt: "asc" }];
  else if (sort === "title-asc") orderBy = [{ title: "asc" }];
  else if (sort === "price-desc") orderBy = [{ price: "desc" }];
  else if (sort === "price-asc") orderBy = [{ price: "asc" }];

  const { skip, take } = paginate(page, limit);

  if (compact) {
    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      }),
      db.course.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          courses,
          pagination: paginationMeta(total, page, limit),
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
        },
      },
    );
  }

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
    db.course.count({ where }),
  ]);

  const countsArray = await db.course.groupBy({
    by: ['status'],
    _count: true,
  });

  const counts = {
    DRAFT: 0,
    PUBLISHED: 0,
    ARCHIVED: 0,
  };
  for (const c of countsArray) {
    counts[c.status as keyof typeof counts] = c._count;
  }

  return NextResponse.json({
    success: true,
    data: { 
      courses, 
      pagination: paginationMeta(total, page, limit),
      counts
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.COURSES);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminCourseSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid course data.", 422, parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;
  if (!isManagedCloudinaryImage(data.thumbnailUrl)) {
    return errorResponse("Upload the course thumbnail before saving.", 422, {
      thumbnailUrl: ["Course thumbnails must use the secure image uploader."],
    });
  }

  const slug = data.slug ?? slugify(data.title);

  const existing = await db.course.findUnique({ where: { slug } });
  if (existing) return errorResponse("A course with this slug already exists.", 409);

  const course = await db.course.create({
    data: {
      slug,
      title: data.title,
      shortDescription: data.shortDescription,
      category: data.category,
      level: data.level,
      subject: data.subject,
      instructorName: data.instructorName,
      thumbnailUrl: data.thumbnailUrl,
      price: data.price,
      originalPrice: data.originalPrice ?? null,
      durationMinutes: data.durationMinutes,
      lessonCount: data.lessonCount,
      featured: data.featured,
      homepageOrder: data.homepageOrder,
      badge: data.badge ?? null,
      status: data.status,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });

  return NextResponse.json(
    { success: true, data: course },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
