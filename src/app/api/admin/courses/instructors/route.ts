import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

const querySchema = z.object({
  search: z.string().trim().max(100).default(""),
});

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.COURSES_VIEW);
  if (error) return error;

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid teacher search.", 422);

  const search = parsed.data.search;
  const teachers = await db.instructor.findMany({
    where: {
      status: "ACTIVE",
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { specialty: { contains: search, mode: "insensitive" as const } },
              { subjects: { has: search } },
            ],
          }
        : {}),
    },
    select: { id: true, fullName: true, specialty: true, avatarUrl: true },
    orderBy: { fullName: "asc" },
    take: 100,
  });

  return NextResponse.json(
    { success: true, data: { teachers } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
