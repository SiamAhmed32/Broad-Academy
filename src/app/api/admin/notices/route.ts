import { NextRequest, NextResponse, after } from "next/server";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { notifyStudentsAboutNotice, serializeNotice } from "@/lib/notices/service";
import { adminNoticeSchema } from "@/lib/notices/validation";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  const notices = await db.notice.findMany({
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: 200,
  });

  return NextResponse.json(
    { success: true, data: { notices: notices.map(serializeNotice) } },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

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

  const { notifyStudents, ...data } = parsed.data;
  const notice = await db.notice.create({ data });

  if (notice.published && notifyStudents) {
    after(() => notifyStudentsAboutNotice(notice).catch(console.error));
  }

  return NextResponse.json(
    { success: true, message: "Notice published.", data: serializeNotice(notice) },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
