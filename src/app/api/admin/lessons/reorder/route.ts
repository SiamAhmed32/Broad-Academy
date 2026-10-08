import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { syncCourseStatsForModule } from "@/lib/courses/sync-course-stats";

export const runtime = "nodejs";

const reorderSchema = z.object({
  moduleId: z.string().min(1),
  ids: z.array(z.string().min(1)).min(1).max(500),
});

export async function PUT(request: NextRequest) {
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

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid order.", 422);

  const { moduleId, ids } = parsed.data;
  const existing = await db.lesson.findMany({
    where: { moduleId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((l) => l.id));
  if (
    ids.length !== existingIds.size ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !existingIds.has(id))
  ) {
    return errorResponse("The lesson list is out of date. Refresh and try again.", 409);
  }

  // Two passes so the (moduleId, displayOrder) unique index never sees a duplicate.
  await db.$transaction([
    ...ids.map((id, index) =>
      db.lesson.update({ where: { id }, data: { displayOrder: -(index + 1) } }),
    ),
    ...ids.map((id, index) =>
      db.lesson.update({ where: { id }, data: { displayOrder: index } }),
    ),
  ]);

  await syncCourseStatsForModule(moduleId);
  return NextResponse.json({ success: true });
}
