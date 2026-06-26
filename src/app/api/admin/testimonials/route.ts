import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { adminListQuerySchema, adminTestimonialSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { isManagedCloudinaryImage } from "@/lib/media/images";

export const runtime = "nodejs";

type TestimonialStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type TestimonialRow = {
  id: string;
  fullName: string;
  identity: string;
  review: string;
  imageUrl: string;
  rating: number;
  featured: boolean;
  displayOrder: number;
  status: TestimonialStatus;
  createdAt: Date;
  updatedAt: Date;
};

type CountRow = {
  status: TestimonialStatus;
  count: bigint;
};

const testimonialListSchema = adminListQuerySchema.extend({
  status: z.enum(["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"]).default("ALL"),
  featured: z.enum(["all", "true", "false"]).default("all"),
  sort: z
    .enum(["order", "newest", "oldest", "name-asc", "rating"])
    .default("order"),
});

function orderBySql(sort: z.infer<typeof testimonialListSchema>["sort"]) {
  switch (sort) {
    case "newest":
      return Prisma.sql`"createdAt" DESC`;
    case "oldest":
      return Prisma.sql`"createdAt" ASC`;
    case "name-asc":
      return Prisma.sql`"fullName" ASC`;
    case "rating":
      return Prisma.sql`"rating" DESC, "displayOrder" ASC`;
    case "order":
    default:
      return Prisma.sql`"displayOrder" ASC, "createdAt" DESC`;
  }
}

function buildWhere(query: z.infer<typeof testimonialListSchema>) {
  const clauses: Prisma.Sql[] = [];

  if (query.status !== "ALL") {
    clauses.push(Prisma.sql`"status" = ${query.status}::"TestimonialStatus"`);
  }

  if (query.featured !== "all") {
    clauses.push(Prisma.sql`"featured" = ${query.featured === "true"}`);
  }

  if (query.search) {
    const search = `%${query.search}%`;
    clauses.push(
      Prisma.sql`("fullName" ILIKE ${search} OR "identity" ILIKE ${search} OR "review" ILIKE ${search})`,
    );
  }

  if (clauses.length === 0) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`;
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.TESTIMONIALS);
  if (error || !user) return error!;

  const parsed = testimonialListSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query parameters.", 422);

  const query = parsed.data;
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.limit;

  const [testimonials, totalRows, countRows] = await Promise.all([
    db.$queryRaw<TestimonialRow[]>`
      SELECT
        "id", "fullName", "identity", "review", "imageUrl", "rating",
        "featured", "displayOrder", "status", "createdAt", "updatedAt"
      FROM "Testimonial"
      ${where}
      ORDER BY ${orderBySql(query.sort)}
      LIMIT ${query.limit}
      OFFSET ${skip}
    `,
    db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Testimonial"
      ${where}
    `,
    db.$queryRaw<CountRow[]>`
      SELECT "status", COUNT(*)::bigint AS count
      FROM "Testimonial"
      GROUP BY "status"
    `,
  ]);

  const total = Number(totalRows[0]?.count ?? 0);
  const counts = countRows.reduce(
    (acc, item) => ({ ...acc, [item.status]: Number(item.count) }),
    { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 },
  );

  return NextResponse.json(
    {
      success: true,
      data: {
        testimonials,
        counts,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.TESTIMONIALS);
  if (error || !user) return error!;

  if (Number(request.headers.get("content-length") || 0) > 12_000) {
    return errorResponse("Request is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminTestimonialSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const data = parsed.data;
  if (!isManagedCloudinaryImage(data.imageUrl)) {
    return errorResponse("Use the secure image uploader for testimonial images.", 422);
  }

  const [testimonial] = await db.$queryRaw<TestimonialRow[]>`
    INSERT INTO "Testimonial" (
      "id", "fullName", "identity", "review", "imageUrl", "rating",
      "featured", "displayOrder", "status", "updatedAt"
    )
    VALUES (
      ${randomUUID()}, ${data.fullName}, ${data.identity}, ${data.review},
      ${data.imageUrl}, ${data.rating}, ${data.featured}, ${data.displayOrder},
      ${data.status}::"TestimonialStatus", NOW()
    )
    RETURNING
      "id", "fullName", "identity", "review", "imageUrl", "rating",
      "featured", "displayOrder", "status", "createdAt", "updatedAt"
  `;

  return NextResponse.json(
    { success: true, message: "Testimonial created.", data: testimonial },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
