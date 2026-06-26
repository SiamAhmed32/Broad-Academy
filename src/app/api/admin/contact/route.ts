import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { adminContactUpdateSchema, adminListQuerySchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

const patchSchema = adminContactUpdateSchema.extend({ id: z.string().min(1) });
const contactListSchema = adminListQuerySchema.extend({
  status: z.enum(["NEW", "READ", "ARCHIVED"]).optional(),
  sort: z.enum(["newest", "oldest", "name-asc", "subject-asc"]).default("newest"),
});

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTACT);
  if (error) return error;

  const parsed = contactListSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, status, sort, page, limit } = parsed.data;
  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
            { role: { contains: search, mode: "insensitive" as const } },
            { message: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : sort === "name-asc"
        ? { fullName: "asc" as const }
        : sort === "subject-asc"
          ? { subject: "asc" as const }
          : { createdAt: "desc" as const };

  const { skip, take } = paginate(page, limit);
  const [messages, total, statusCounts] = await Promise.all([
    db.contactMessage.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
    db.contactMessage.count({ where }),
    db.contactMessage.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);
  const counts = { NEW: 0, READ: 0, ARCHIVED: 0 };
  for (const item of statusCounts) counts[item.status] = item._count._all;

  return NextResponse.json(
    {
      success: true,
      data: {
        messages,
        counts,
        pagination: paginationMeta(total, page, limit),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTACT);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 422);

  const existing = await db.contactMessage.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!existing) return errorResponse("Contact message not found.", 404);

  const message = await db.contactMessage.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(
    { success: true, data: message },
    { headers: { "Cache-Control": "no-store" } },
  );
}
