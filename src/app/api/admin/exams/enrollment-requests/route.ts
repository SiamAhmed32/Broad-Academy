import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { adminListQuerySchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const requestDetailInclude = {
  user: {
    select: { id: true, fullName: true, email: true, phone: true },
  },
  exam: { select: { id: true, title: true, slug: true, price: true } },
  reviewedBy: { select: { fullName: true } },
} as const;

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const parsed = adminListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, status, page, limit } = parsed.data;

  const where = {
    ...(status
      ? {
          status: status as
            | "PENDING"
            | "APPROVED"
            | "REJECTED"
            | "CANCELLED",
        }
      : {}),
    ...(search
      ? {
          OR: [
            { user: { fullName: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
            { exam: { title: { contains: search, mode: "insensitive" as const } } },
            { bkashTransactionId: { contains: search, mode: "insensitive" as const } },
            { bkashSenderNumber: { contains: search, mode: "insensitive" as const } },
            { studentPhone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const { skip, take } = paginate(page, limit);

  const [requests, total] = await Promise.all([
    db.examEnrollmentRequest.findMany({
      where,
      include: requestDetailInclude,
      orderBy: { submittedAt: "desc" },
      skip,
      take,
    }),
    db.examEnrollmentRequest.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      requests,
      pagination: paginationMeta(total, page, limit),
    },
  });
}
