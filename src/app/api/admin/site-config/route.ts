import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

const SITE_CONFIG_ID = "default";

const patchSchema = z.object({
  enrollmentGuideYoutubeUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((value) => value || null),
});

export async function GET() {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.ENROLLMENTS);
  if (error) return error;

  try {
    const config = await db.siteConfig.upsert({
      where: { id: SITE_CONFIG_ID },
      create: { id: SITE_CONFIG_ID },
      update: {},
    });
    return NextResponse.json({ success: true, data: config });
  } catch {
    return NextResponse.json({
      success: true,
      data: { id: SITE_CONFIG_ID, enrollmentGuideYoutubeUrl: null },
    });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.ENROLLMENTS);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid site settings.", 422);
  }

  const config = await db.siteConfig.upsert({
    where: { id: SITE_CONFIG_ID },
    create: {
      id: SITE_CONFIG_ID,
      enrollmentGuideYoutubeUrl: parsed.data.enrollmentGuideYoutubeUrl,
    },
    update: {
      enrollmentGuideYoutubeUrl: parsed.data.enrollmentGuideYoutubeUrl,
    },
  });

  revalidateTag("site-config", "max");

  return NextResponse.json({
    success: true,
    data: config,
    message: "Site settings saved.",
  });
}
