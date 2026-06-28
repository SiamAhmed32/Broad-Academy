import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { adminListQuerySchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const requestListInclude = {
  user: {
    select: { id: true, fullName: true, email: true, phone: true },
  },
  exam: { select: { id: true, title: true, slug: true, price: true } },
} as const;

type ExamRequestRow = Awaited<
  ReturnType<
    typeof db.examEnrollmentRequest.findMany<{ include: typeof requestListInclude }>
  >
>[number];

function buildWhereClause({
  id,
  search,
  status,
}: {
  id?: string;
  search?: string;
  status?: string;
}) {
  if (id) return { id };

  return {
    ...(status
      ? {
          status: status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
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
}

async function serializeExamRequests(requests: ExamRequestRow[]) {
  const reviewerIds = [
    ...new Set(
      requests
        .map((request) => request.reviewedById)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const reviewers =
    reviewerIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: reviewerIds } },
          select: { id: true, fullName: true },
        })
      : [];

  const reviewerNames = new Map(reviewers.map((user) => [user.id, user.fullName]));

  return requests.map((request) => ({
    ...request,
    submittedAt: request.submittedAt.toISOString(),
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    reviewedBy: request.reviewedById
      ? { fullName: reviewerNames.get(request.reviewedById) ?? "Staff" }
      : null,
  }));
}

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.EXAMS);
  if (error) return error;

  const parsed = adminListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { id, search, status, page, limit } = parsed.data;
  const where = buildWhereClause({ id, search, status });
  const { skip, take } = paginate(page, limit);

  try {
    const [requests, total] = await Promise.all([
      db.examEnrollmentRequest.findMany({
        where,
        include: requestListInclude,
        orderBy: { submittedAt: "desc" },
        skip,
        take,
      }),
      db.examEnrollmentRequest.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          requests: await serializeExamRequests(requests),
          pagination: paginationMeta(total, page, limit),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Failed to load exam enrollment requests:", err);
    return errorResponse("Could not load exam access requests.", 500);
  }
}
