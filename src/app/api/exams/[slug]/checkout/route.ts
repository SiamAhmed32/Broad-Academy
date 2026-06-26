import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import {
  checkRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
  recordFailedAttempt,
} from "@/lib/auth/security";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";
import {
  deletePaymentProof,
  uploadPaymentProof,
} from "@/lib/enrollments/cloudinary";
import { examCheckoutSchema } from "@/lib/exams/validation";
import { notifyActiveAdmins } from "@/lib/notifications/service";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 256 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return errorResponse("Sign in with a student account to register.", 401);
  }

  if (!process.env.BKASH_PAYMENT_NUMBER?.trim()) {
    return errorResponse("bKash payments are not configured yet.", 503);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return errorResponse("Payment screenshot must be 5 MB or smaller.", 413);
  }

  const rateKey = hashValue(
    `exam-checkout:${user.id}:${hashValue(getClientIp(request))}`,
  );
  const rateLimit = await checkRateLimit(rateKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many attempts. Please wait and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form payload.", 400);
  }

  const exam = await db.exam.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, price: true, title: true },
  });
  if (!exam) return errorResponse("Exam not found.", 404);
  if (exam.price === 0) return errorResponse("This exam is free to take.", 400);

  const parsed = examCheckoutSchema.safeParse({
    examId: exam.id,
    studentPhone: formData.get("studentPhone"),
    guardianPhone: formData.get("guardianPhone"),
    bkashSenderNumber: formData.get("bkashSenderNumber"),
    bkashTransactionId: formData.get("bkashTransactionId"),
    classLevel: formData.get("classLevel"),
    studentNote: formData.get("studentNote"),
  });

  if (!parsed.success) {
    return errorResponse(
      "Please review the payment details.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const file = formData.get("paymentProof");
  if (!(file instanceof File) || file.size === 0) {
    return errorResponse("A payment screenshot is required.", 422, {
      paymentProof: ["Upload your bKash payment screenshot."],
    });
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

  const [enrollment, existingRequest] = await Promise.all([
    db.examEnrollment.findUnique({
      where: {
        userId_examId: { userId: user.id, examId: exam.id },
      },
      select: { status: true },
    }),
    db.examEnrollmentRequest.findUnique({
      where: {
        userId_examId: { userId: user.id, examId: exam.id },
      },
      select: { status: true, paymentProofPublicId: true },
    }),
  ]);

  if (enrollment?.status === "ACTIVE") {
    return errorResponse("You already have access to this exam.", 409);
  }
  if (
    existingRequest &&
    ["PENDING", "APPROVED"].includes(existingRequest.status)
  ) {
    return errorResponse("You already have an enrollment request pending.", 409);
  }

  let proof: { public_id: string; format: string; version: number; bytes: number };
  try {
    proof = await uploadPaymentProof(bytes, file.type);
  } catch (error) {
    console.error("Cloudinary proof upload failed:", error);
    return errorResponse("Image storage failed. Try again.", 502);
  }

  try {
    const saved = await db.examEnrollmentRequest.upsert({
      where: {
        userId_examId: {
          userId: user.id,
          examId: exam.id,
        },
      },
      update: {
        status: "PENDING",
        studentPhone: parsed.data.studentPhone,
        guardianPhone: parsed.data.guardianPhone,
        bkashSenderNumber: parsed.data.bkashSenderNumber,
        bkashTransactionId: parsed.data.bkashTransactionId,
        classLevel: parsed.data.classLevel,
        paidAmount: exam.price,
        paymentProofPublicId: proof.public_id,
        paymentProofFormat: proof.format,
        studentNote: parsed.data.studentNote,
        reviewedById: null,
        reviewNote: null,
        reviewedAt: null,
        submittedAt: new Date(),
      },
      create: {
        userId: user.id,
        examId: exam.id,
        studentPhone: parsed.data.studentPhone,
        guardianPhone: parsed.data.guardianPhone,
        bkashSenderNumber: parsed.data.bkashSenderNumber,
        bkashTransactionId: parsed.data.bkashTransactionId,
        classLevel: parsed.data.classLevel,
        paidAmount: exam.price,
        paymentProofPublicId: proof.public_id,
        paymentProofFormat: proof.format,
        studentNote: parsed.data.studentNote,
      },
      select: { id: true, status: true, submittedAt: true },
    });

    await recordFailedAttempt(rateKey);

    void notifyActiveAdmins({
      title: "New Exam payment request",
      content: `${user.fullName} submitted payment proof for Exam "${exam.title}".`,
      type: "EXAM_PAYMENT_SUBMITTED",
      category: "ALERT",
      link: `/admin/exams/requests?id=${saved.id}`,
    }).catch(() => undefined);

    if (existingRequest?.paymentProofPublicId) {
      void deletePaymentProof(existingRequest.paymentProofPublicId).catch(() => undefined);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Your payment proof was submitted. Our team will verify it before unlocking the exam.",
        data: {
          ...saved,
          submittedAt: saved.submittedAt.toISOString(),
        },
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    void deletePaymentProof(proof.public_id).catch(() => undefined);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(
        "This bKash transaction ID has already been submitted.",
        409,
      );
    }
    return errorResponse("The enrollment request could not be saved.", 500);
  }
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
