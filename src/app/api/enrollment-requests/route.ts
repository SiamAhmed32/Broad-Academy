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
import { enrollmentRequestSchema } from "@/lib/enrollments/validation";
import { sendEnrollmentSubmittedEmails } from "@/lib/enrollments/email";
import { notifyActiveAdmins } from "@/lib/notifications/service";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 256 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return errorResponse("Sign in with a student account to enroll.", 401);
  }

  const courseId = request.nextUrl.searchParams.get("courseId")?.trim();
  if (!courseId) return errorResponse("Course is required.", 422);

  const [course, enrollment, enrollmentRequest, studentProfile] = await Promise.all([
    db.course.findFirst({
      where: { id: courseId, status: "PUBLISHED" },
      select: { id: true, slug: true, title: true, price: true },
    }),
    db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: { status: true },
    }),
    db.enrollmentRequest.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reviewNote: true,
        classLevel: true,
      },
    }),
    db.user.findUnique({
      where: { id: user.id },
      select: { classLevel: true },
    }),
  ]);

  if (!course) return errorResponse("Course not found.", 404);

  return NextResponse.json(
    {
      success: true,
      data: {
        course,
        hasAccess: enrollment?.status === "ACTIVE",
        enrollmentStatus: enrollment?.status ?? null,
        request: enrollmentRequest
          ? {
              ...enrollmentRequest,
              submittedAt: enrollmentRequest.submittedAt.toISOString(),
            }
          : null,
        bkashNumber: process.env.BKASH_PAYMENT_NUMBER?.trim() || null,
        paymentConfigured: Boolean(process.env.BKASH_PAYMENT_NUMBER?.trim()),
        profilePhone: user.phone,
        profileClassLevel: studentProfile?.classLevel ?? null,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return errorResponse("Sign in with a student account to enroll.", 401);
  }

  if (!process.env.BKASH_PAYMENT_NUMBER?.trim()) {
    return errorResponse("bKash enrollment payments are not configured yet.", 503);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return errorResponse("Payment screenshot must be 5 MB or smaller.", 413);
  }

  const rateKey = hashValue(
    `enrollment:${user.id}:${hashValue(getClientIp(request))}`,
  );
  const rateLimit = await checkRateLimit(rateKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many enrollment attempts. Please wait and try again.",
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
    return errorResponse("Invalid enrollment form.", 400);
  }

  const parsed = enrollmentRequestSchema.safeParse({
    courseId: formData.get("courseId"),
    studentPhone: formData.get("studentPhone"),
    guardianPhone: formData.get("guardianPhone"),
    bkashSenderNumber: formData.get("bkashSenderNumber"),
    bkashTransactionId: formData.get("bkashTransactionId"),
    classLevel: formData.get("classLevel"),
    studentNote: formData.get("studentNote"),
  });

  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted enrollment details.",
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

  const [course, enrollment, existingRequest] = await Promise.all([
    db.course.findFirst({
      where: { id: parsed.data.courseId, status: "PUBLISHED" },
      select: { id: true, price: true, title: true, slug: true },
    }),
    db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: parsed.data.courseId,
        },
      },
      select: { status: true },
    }),
    db.enrollmentRequest.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: parsed.data.courseId,
        },
      },
      select: { status: true, paymentProofPublicId: true },
    }),
  ]);

  if (!course) return errorResponse("Course not found.", 404);
  if (enrollment?.status === "ACTIVE") {
    return errorResponse("You already have access to this course.", 409);
  }
  if (
    existingRequest &&
    ["PENDING", "REVIEWING", "APPROVED"].includes(existingRequest.status)
  ) {
    return errorResponse("You already have an enrollment request for this course.", 409);
  }

  let proof: Awaited<ReturnType<typeof uploadPaymentProof>>;
  try {
    proof = await uploadPaymentProof(bytes, file.type);
  } catch (error) {
    console.error("Cloudinary payment proof upload failed:", error);
    const detail =
      error instanceof Error
        ? error.message
        : "Cloudinary upload failed.";
    const friendlyMessage = detail.includes('missing permissions')
      ? "Your Cloudinary API key cannot upload images. In Cloudinary → Settings → API Keys, edit the key and enable Upload (create) permission, or use the Root key in .env, then restart npm run dev."
      : `Payment screenshot storage failed: ${detail}`;
    return errorResponse(friendlyMessage, 502);
  }

  try {
    const saved = await db.enrollmentRequest.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
      update: {
        status: "PENDING",
        studentPhone: parsed.data.studentPhone,
        guardianPhone: parsed.data.guardianPhone,
        bkashSenderNumber: parsed.data.bkashSenderNumber,
        bkashTransactionId: parsed.data.bkashTransactionId,
        classLevel: parsed.data.classLevel,
        paidAmount: course.price,
        paymentProofPublicId: proof.public_id,
        paymentProofFormat: proof.format,
        paymentProofVersion: proof.version,
        paymentProofBytes: proof.bytes,
        studentNote: parsed.data.studentNote,
        reviewedById: null,
        reviewNote: null,
        reviewedAt: null,
        submittedAt: new Date(),
      },
      create: {
        userId: user.id,
        courseId: course.id,
        studentPhone: parsed.data.studentPhone,
        guardianPhone: parsed.data.guardianPhone,
        bkashSenderNumber: parsed.data.bkashSenderNumber,
        bkashTransactionId: parsed.data.bkashTransactionId,
        classLevel: parsed.data.classLevel,
        paidAmount: course.price,
        paymentProofPublicId: proof.public_id,
        paymentProofFormat: proof.format,
        paymentProofVersion: proof.version,
        paymentProofBytes: proof.bytes,
        studentNote: parsed.data.studentNote,
      },
      select: { id: true, status: true, submittedAt: true },
    });

    await recordFailedAttempt(rateKey);
    void sendEnrollmentSubmittedEmails({
      requestId: saved.id,
      studentName: user.fullName,
      studentEmail: user.email,
      courseTitle: course.title,
      courseSlug: course.slug,
      transactionId: parsed.data.bkashTransactionId,
      paidAmount: course.price,
      studentPhone: parsed.data.studentPhone,
      guardianPhone: parsed.data.guardianPhone,
      bkashSenderNumber: parsed.data.bkashSenderNumber,
    }).catch(() => undefined);
    void notifyActiveAdmins({
      title: "New enrollment request",
      content: `${user.fullName} submitted payment proof for "${course.title}".`,
      type: "ENROLLMENT_SUBMITTED",
      category: "ALERT",
      link: `/admin/enrollments?request=${saved.id}`,
    }).catch((error) => {
      console.error("Failed to notify admins about enrollment request:", error);
    });
    if (existingRequest?.paymentProofPublicId) {
      void deletePaymentProof(existingRequest.paymentProofPublicId).catch(() => undefined);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Your payment proof was submitted. Our team will verify it before activating the course.",
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
