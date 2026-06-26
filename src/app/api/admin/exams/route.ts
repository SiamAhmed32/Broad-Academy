import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta, slugify } from "@/lib/admin/utils";
import { adminExamSchema, adminListQuerySchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { isManagedCloudinaryImage } from "@/lib/media/images";

export const runtime = "nodejs";

const DEFAULT_EXAM_END = new Date("2099-12-31T23:59:59.000Z");

const examListQuerySchema = adminListQuerySchema.extend({
  price: adminListQuerySchema.shape.status.optional(),
  schedule: adminListQuerySchema.shape.status.optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const parsed = examListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, status, price, schedule, page, limit } = parsed.data;
  const now = new Date();
  const where = {
    ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
    ...(price === "FREE"
      ? { price: 0 }
      : price === "PAID"
        ? { price: { gt: 0 } }
        : {}),
    ...(schedule === "UPCOMING"
      ? { startsAt: { gt: now } }
      : schedule === "LIVE"
        ? { startsAt: { lte: now }, endsAt: { gte: now } }
        : schedule === "ENDED"
          ? { endsAt: { lt: now } }
          : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ExamOrderByWithRelationInput[] = [{ updatedAt: "desc" }];
  const { skip, take } = paginate(page, limit);

  const [exams, total] = await Promise.all([
    db.exam.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    }),
    db.exam.count({ where }),
  ]);

  const countsArray = await db.exam.groupBy({
    by: ["status"],
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
      exams,
      pagination: paginationMeta(total, page, limit),
      counts,
    },
  });
}

export async function POST(request: NextRequest) {
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

  const slug = data.slug ?? slugify(data.title);

  const existing = await db.exam.findUnique({ where: { slug } });
  if (existing) return errorResponse("An exam with this slug already exists.", 409);

  const exam = await db.exam.create({
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

  return NextResponse.json(
    { success: true, data: exam },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
