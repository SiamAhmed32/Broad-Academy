import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { adminAnnouncementSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.NOTICES);
  if (error) return error;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminAnnouncementSchema.partial().safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid announcement data.", 422, parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;

  const updated = await db.$transaction(async (tx) => {
    if (data.isActive) {
      // Deactivate all other announcements
      await tx.announcement.updateMany({
        where: { id: { not: id }, isActive: true },
        data: { isActive: false },
      });
    }
    return tx.announcement.update({
      where: { id },
      data,
    });
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.NOTICES);
  if (error) return error;

  const { id } = await context.params;

  await db.announcement.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Announcement deleted." });
}
