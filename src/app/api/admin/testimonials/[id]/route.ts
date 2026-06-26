import { NextRequest, NextResponse } from "next/server";
import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { adminTestimonialSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { isManagedCloudinaryImage } from "@/lib/media/images";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type TestimonialRow = {
  id: string;
  fullName: string;
  identity: string;
  review: string;
  imageUrl: string;
  rating: number;
  featured: boolean;
  displayOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.TESTIMONIALS);
  if (error || !user) return error!;

  const { id } = await context.params;
  if (!id) return errorResponse("Missing testimonial id.", 400);

  if (Number(request.headers.get("content-length") || 0) > 12_000) {
    return errorResponse("Request is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminTestimonialSchema.partial().safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const existing = await db.$queryRaw<TestimonialRow[]>`
    SELECT
      "id", "fullName", "identity", "review", "imageUrl", "rating",
      "featured", "displayOrder", "status", "createdAt", "updatedAt"
    FROM "Testimonial"
    WHERE "id" = ${id}
    LIMIT 1
  `;

  if (!existing[0]) return errorResponse("Testimonial not found.", 404);

  const merged = { ...existing[0], ...parsed.data };
  if (!isManagedCloudinaryImage(merged.imageUrl)) {
    return errorResponse("Use the secure image uploader for testimonial images.", 422);
  }

  const [testimonial] = await db.$queryRaw<TestimonialRow[]>`
    UPDATE "Testimonial"
    SET
      "fullName" = ${merged.fullName},
      "identity" = ${merged.identity},
      "review" = ${merged.review},
      "imageUrl" = ${merged.imageUrl},
      "rating" = ${merged.rating},
      "featured" = ${merged.featured},
      "displayOrder" = ${merged.displayOrder},
      "status" = ${merged.status}::"TestimonialStatus",
      "updatedAt" = NOW()
    WHERE "id" = ${id}
    RETURNING
      "id", "fullName", "identity", "review", "imageUrl", "rating",
      "featured", "displayOrder", "status", "createdAt", "updatedAt"
  `;

  return NextResponse.json(
    { success: true, message: "Testimonial updated.", data: testimonial },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.TESTIMONIALS);
  if (error || !user) return error!;

  const { id } = await context.params;
  if (!id) return errorResponse("Missing testimonial id.", 400);

  const updated = await db.$executeRaw`
    UPDATE "Testimonial"
    SET "status" = ${"ARCHIVED"}::"TestimonialStatus", "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;

  if (updated === 0) return errorResponse("Testimonial not found.", 404);

  return NextResponse.json(
    { success: true, message: "Testimonial archived." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
