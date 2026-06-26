import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { getCurrentUser } from "@/lib/auth/session";
import { isTrustedOrigin } from "@/lib/auth/security";
import { counsellingPaymentSubmissionSchema } from "@/lib/counselling/payment";
import { db } from "@/lib/db";
import {
  deletePaymentProof,
  uploadPaymentProof,
} from "@/lib/enrollments/cloudinary";
import { sendCounsellingPaymentSubmittedEmails } from "@/lib/counselling/email";
import { notifyActiveAdmins } from "@/lib/notifications/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  if (!process.env.BKASH_PAYMENT_NUMBER?.trim()) {
    return errorResponse("Payment is not configured yet. Please contact support.", 503);
  }

  const { id } = await context.params;

  const booking = await db.counsellingBooking.findUnique({
    where: { id },
  });

  if (!booking) {
    return errorResponse("Booking not found.", 404);
  }
  if (booking.archivedAt) {
    return errorResponse("Archived sessions cannot accept payment submissions.", 409);
  }

  const isOwner =
    booking.userId === user.id ||
    booking.email.toLowerCase() === user.email.toLowerCase();
  if (!isOwner) {
    return errorResponse("You are not authorized to submit payment for this booking.", 403);
  }

  if (booking.paymentStatus !== "AWAITING_PAYMENT") {
    return errorResponse("This session is not awaiting payment.", 409);
  }

  if (!booking.sessionFee || booking.sessionFee <= 0) {
    return errorResponse("No session fee has been quoted yet.", 409);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form data.");
  }

  const parsed = counsellingPaymentSubmissionSchema.safeParse({
    bkashSenderNumber: formData.get("bkashSenderNumber"),
    bkashTransactionId: formData.get("bkashTransactionId"),
  });

  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues[0]?.message || "Invalid payment details.",
      422,
    );
  }

  const file = formData.get("paymentProof");
  if (!(file instanceof File) || file.size === 0) {
    return errorResponse("Upload a payment screenshot.", 422);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return errorResponse("Payment screenshot must be 5 MB or smaller.", 422);
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return errorResponse("Upload a JPG, PNG, or WebP screenshot.", 422);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidImageSignature(bytes, file.type)) {
    return errorResponse("The payment proof is not a valid image.", 422);
  }

  if (booking.paymentProofPublicId) {
    await deletePaymentProof(booking.paymentProofPublicId).catch(console.error);
  }

  let proof: Awaited<ReturnType<typeof uploadPaymentProof>>;
  try {
    proof = await uploadPaymentProof(bytes, file.type);
  } catch (error) {
    console.error("Counselling payment proof upload failed:", error);
    const detail = error instanceof Error ? error.message : "Cloudinary upload failed.";
    return errorResponse(`Payment screenshot storage failed: ${detail}`, 502);
  }

  const updated = await db.counsellingBooking.update({
    where: { id },
    data: {
      bkashSenderNumber: parsed.data.bkashSenderNumber,
      bkashTransactionId: parsed.data.bkashTransactionId,
      paymentProofPublicId: proof.public_id,
      paymentProofFormat: proof.format,
      paymentProofUrl: null,
      paymentStatus: "PROOF_SUBMITTED",
      paymentSubmittedAt: new Date(),
    },
  });

  await notifyActiveAdmins({
    title: "Counselling payment proof submitted",
    content: `${booking.fullName} submitted bKash proof for a counselling session (৳${booking.sessionFee?.toLocaleString("en-US")}).`,
    type: "COUNSELLING_PAYMENT_PROOF",
    category: "ALERT",
    link: "/admin/counselling",
  }).catch(console.error);

  sendCounsellingPaymentSubmittedEmails({
    fullName: booking.fullName,
    email: booking.email,
    sessionFee: booking.sessionFee,
    preferredDate: booking.preferredDate,
    preferredTime: booking.preferredTime,
    bkashTransactionId: parsed.data.bkashTransactionId,
  }).catch(console.error);

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      paymentStatus: updated.paymentStatus,
      paymentSubmittedAt: updated.paymentSubmittedAt?.toISOString() ?? null,
    },
  });
}

function hasValidImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((byte, index) => bytes[index] === byte);
  }
  if (mimeType === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}
