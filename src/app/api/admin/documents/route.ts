import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { adminDocumentUpdateSchema, adminListQuerySchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

const patchSchema = adminDocumentUpdateSchema.extend({ id: z.string().min(1) });

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.DOCUMENTS);
  if (error) return error;

  const parsed = adminListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { status, search, page, limit } = parsed.data;
  const where = {
    ...(status ? { status: status as "PENDING" | "REVIEWED" | "APPROVED" | "REJECTED" } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { documentType: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };



  const { skip, take } = paginate(page, limit);
  const [documents, total, countsArray] = await Promise.all([
    db.documentSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.documentSubmission.count({ where }),
    db.documentSubmission.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const counts = {
    PENDING: 0,
    REVIEWED: 0,
    APPROVED: 0,
    REJECTED: 0,
  };
  for (const c of countsArray) {
    counts[c.status as keyof typeof counts] = c._count;
  }
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    success: true,
    data: {
      documents,
      pagination: paginationMeta(total, page, limit),
      counts: { ALL: totalAll, ...counts },
    },
  });
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.DOCUMENTS);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 422);

  const document = await db.documentSubmission.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      ...("reviewNote" in parsed.data
        ? { reviewNote: parsed.data.reviewNote ?? null }
        : {}),
    },
  });

  return NextResponse.json({ success: true, data: document });
}
