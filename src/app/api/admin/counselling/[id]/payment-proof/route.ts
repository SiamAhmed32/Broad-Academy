import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";
import { createPaymentProofDownloadUrl } from "@/lib/enrollments/cloudinary";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.COUNSELLING);
  if (error) return error;

  const { id } = await context.params;
  const booking = await db.counsellingBooking.findUnique({
    where: { id },
    select: {
      paymentProofPublicId: true,
      paymentProofFormat: true,
    },
  });

  if (!booking?.paymentProofPublicId || !booking.paymentProofFormat) {
    return errorResponse("Payment proof not found.", 404);
  }

  const url = createPaymentProofDownloadUrl(
    booking.paymentProofPublicId,
    booking.paymentProofFormat,
  );

  return NextResponse.redirect(url, {
    status: 307,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
    },
  });
}
