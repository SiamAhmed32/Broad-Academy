import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { adminListQuerySchema, adminAnnouncementSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.NOTICES);
  if (error) return error;

  const parsed = adminListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, status, page, limit } = parsed.data;
  
  const where = {
    ...(status === "ACTIVE" ? { isActive: true } : status === "INACTIVE" ? { isActive: false } : {}),
    ...(search ? { text: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const { skip, take } = paginate(page, limit);
  const [announcements, total] = await Promise.all([
    db.announcement.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.announcement.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { announcements, pagination: paginationMeta(total, page, limit) },
  });
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.NOTICES);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminAnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid announcement.", 422, parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;

  // If the new announcement is active, deactivate all other announcements first
  const announcement = await db.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.announcement.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }
    return tx.announcement.create({
      data,
    });
  });

  return NextResponse.json({ success: true, data: announcement }, { status: 201 });
}
