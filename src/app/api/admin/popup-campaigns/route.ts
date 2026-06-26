import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import {
  adminListQuerySchema,
  adminPopupCampaignSchema,
} from "@/lib/admin/validation";
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

  const { page, limit, search, status } = parsed.data;
  const where = {
    ...(status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)
      ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { content: { contains: search, mode: "insensitive" as const } },
            { badge: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const { skip, take } = paginate(page, limit);

  const [campaigns, total] = await Promise.all([
    db.popupCampaign.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    db.popupCampaign.count({ where }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: { campaigns, pagination: paginationMeta(total, page, limit) },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.NOTICES);
  if (error || !user) return error!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const parsed = adminPopupCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Review the campaign details.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const campaign = await db.popupCampaign.create({
    data: {
      ...parsed.data,
      badge: parsed.data.badge || null,
      imageUrl: parsed.data.imageUrl || null,
      ctaText: parsed.data.ctaText || null,
      ctaLink: parsed.data.ctaLink || null,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  return NextResponse.json(
    {
      success: true,
      message:
        campaign.status === "PUBLISHED"
          ? "Popup campaign published."
          : "Popup campaign saved.",
      data: campaign,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
