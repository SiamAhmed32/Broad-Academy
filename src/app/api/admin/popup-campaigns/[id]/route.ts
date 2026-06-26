import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { adminPopupCampaignSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

const archiveSchema = z.object({ action: z.literal("archive") });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.NOTICES);
  if (error || !user) return error!;

  const { id } = await context.params;
  const existing = await db.popupCampaign.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return errorResponse("Campaign not found.", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const archive = archiveSchema.safeParse(body);
  if (archive.success) {
    const campaign = await db.popupCampaign.update({
      where: { id },
      data: { status: "ARCHIVED", updatedById: user.id },
    });
    return NextResponse.json(
      { success: true, message: "Campaign archived.", data: campaign },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = adminPopupCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Review the campaign details.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const campaign = await db.popupCampaign.update({
    where: { id },
    data: {
      ...parsed.data,
      badge: parsed.data.badge || null,
      imageUrl: parsed.data.imageUrl || null,
      ctaText: parsed.data.ctaText || null,
      ctaLink: parsed.data.ctaLink || null,
      updatedById: user.id,
    },
  });

  return NextResponse.json(
    { success: true, message: "Campaign updated.", data: campaign },
    { headers: { "Cache-Control": "no-store" } },
  );
}
