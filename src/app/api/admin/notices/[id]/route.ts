import { NextRequest, NextResponse, after } from "next/server";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { notifyStudentsAboutNotice, serializeNotice } from "@/lib/notices/service";
import { adminNoticeSchema } from "@/lib/notices/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminNoticeSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const existing = await db.notice.findUnique({ where: { id } });
  if (!existing) return errorResponse("Notice not found.", 404);

  const { notifyStudents, ...data } = parsed.data;
  const isNewlyPublished = data.published && !existing.published;

  const notice = await db.notice.update({
    where: { id },
    data: {
      ...data,
      ...(isNewlyPublished ? { publishedAt: new Date() } : {}),
    },
  });

  if (isNewlyPublished && notifyStudents) {
    after(() => notifyStudentsAboutNotice(notice).catch(console.error));
  }

  return NextResponse.json(
    { success: true, message: "Notice updated.", data: serializeNotice(notice) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  const { id } = await context.params;
  const deleted = await db.notice.deleteMany({ where: { id } });
  if (deleted.count === 0) return errorResponse("Notice not found.", 404);

  return NextResponse.json(
    { success: true, message: "Notice deleted." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
