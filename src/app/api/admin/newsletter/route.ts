import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "UNSUBSCRIBED", "all"]).default("all"),
});

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTACT);
  if (error) return error;

  const parsed = listSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { page, limit, search, status } = parsed.data;
  const where = {
    ...(status !== "all" ? { status } : {}),
    ...(search
      ? { email: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const { skip, take } = paginate(page, limit);
  const [subscribers, total, activeCount] = await Promise.all([
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      subscribers,
      counts: { active: activeCount, total },
      pagination: paginationMeta(total, page, limit),
    },
  });
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "UNSUBSCRIBED"]),
});

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
    return errorResponse("Invalid request body.", 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid update.", 422);

  const updated = await db.newsletterSubscriber.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ success: true, data: updated });
}
