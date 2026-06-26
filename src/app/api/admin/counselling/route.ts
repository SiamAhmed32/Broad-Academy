import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { sendBookingStatusUpdateEmail, sendCounsellingFeeQuotedEmail, sendCounsellingPaymentVerifiedEmail } from "@/lib/counselling/email";
import { counsellingAdminPatchSchema, canConfirmCounsellingSession } from "@/lib/counselling/payment";
import { deletePaymentProof } from "@/lib/enrollments/cloudinary";
import { deleteCounsellingFile } from "@/lib/counselling/cloudinary";
import { createUserNotification } from "@/lib/notifications/service";

const counsellingListSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  paymentStatus: z
    .enum(["UNQUOTED", "AWAITING_PAYMENT", "PROOF_SUBMITTED", "PAID", "WAIVED"])
    .optional(),
  subject: z.string().trim().max(100).optional(),
  educationLevel: z.string().trim().max(100).optional(),
  view: z.enum(["active", "archived", "all"]).default("active"),
  sort: z
    .enum(["newest", "oldest", "session-soonest", "session-latest", "name-asc"])
    .default("newest"),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

const deleteSchema = z.object({
  id: z.string().min(1),
  confirmation: z.literal("DELETE"),
});

const AUTO_ARCHIVE_AFTER_DAYS = 90;
const AUTO_ARCHIVE_THROTTLE_MS = 60_000;
let lastAutoArchiveRunAt = 0;

type BookingWithFiles = Prisma.CounsellingBookingGetPayload<{
  include: {
    files: {
      select: {
        id: true;
        fileName: true;
        fileUrl: true;
        uploadedByRole: true;
        uploadedByName: true;
        createdAt: true;
      };
    };
  };
}>;

async function autoArchiveOldBookings() {
  const now = Date.now();
  if (now - lastAutoArchiveRunAt < AUTO_ARCHIVE_THROTTLE_MS) return;
  lastAutoArchiveRunAt = now;

  const archiveCutoff = new Date(
    now - AUTO_ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000,
  );
  await db.counsellingBooking.updateMany({
    where: {
      archivedAt: null,
      status: { in: ["COMPLETED", "CANCELLED"] },
      updatedAt: { lt: archiveCutoff },
    },
    data: { archivedAt: new Date(), archivedById: null },
  });
}

function serializeBooking(booking: BookingWithFiles) {
  return {
    id: booking.id,
    fullName: booking.fullName,
    email: booking.email,
    phone: booking.phone,
    educationLevel: booking.educationLevel,
    subjectInterest: booking.subjectInterest,
    preferredDate: booking.preferredDate.toISOString(),
    preferredTime: booking.preferredTime,
    message: booking.message,
    status: booking.status,
    meetingLink: booking.meetingLink,
    counsellorNotes: booking.counsellorNotes,
    sessionFee: booking.sessionFee,
    feeQuotedAt: booking.feeQuotedAt?.toISOString() ?? null,
    paymentStatus: booking.paymentStatus,
    bkashSenderNumber: booking.bkashSenderNumber,
    bkashTransactionId: booking.bkashTransactionId,
    paymentSubmittedAt: booking.paymentSubmittedAt?.toISOString() ?? null,
    paidAt: booking.paidAt?.toISOString() ?? null,
    paymentNote: booking.paymentNote,
    archivedAt: booking.archivedAt?.toISOString() ?? null,
    archivedById: booking.archivedById,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    hasPaymentProof: Boolean(booking.paymentProofPublicId),
    files: booking.files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      uploadedByRole: file.uploadedByRole,
      uploadedByName: file.uploadedByName,
      createdAt: file.createdAt.toISOString(),
    })),
  };
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.COUNSELLING);
  if (error || !user) return error!;

  const parsed = counsellingListSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  await autoArchiveOldBookings();

  const {
    status,
    paymentStatus,
    subject,
    educationLevel,
    view,
    sort,
    dateFrom,
    dateTo,
    page,
    limit,
    search,
  } = parsed.data;

  const where: Prisma.CounsellingBookingWhereInput = {
    ...(view === "active"
      ? { archivedAt: null }
      : view === "archived"
        ? { archivedAt: { not: null } }
        : {}),
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(subject ? { subjectInterest: subject } : {}),
    ...(educationLevel ? { educationLevel } : {}),
    ...(dateFrom || dateTo
      ? {
          preferredDate: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { subjectInterest: { contains: search, mode: "insensitive" } },
      { educationLevel: { contains: search, mode: "insensitive" } },
      { bkashTransactionId: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : sort === "session-soonest"
        ? { preferredDate: "asc" as const }
        : sort === "session-latest"
          ? { preferredDate: "desc" as const }
          : sort === "name-asc"
            ? { fullName: "asc" as const }
            : { createdAt: "desc" as const };

  const { skip, take } = paginate(page, limit);
  const [bookings, total, countsArray, archivedCount, subjects, educationLevels] =
    await Promise.all([
    db.counsellingBooking.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        files: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            uploadedByRole: true,
            uploadedByName: true,
            createdAt: true,
          },
        },
      },
    }),
    db.counsellingBooking.count({ where }),
    db.counsellingBooking.groupBy({
      by: ["status"],
      where: { archivedAt: null },
      _count: true,
    }),
    db.counsellingBooking.count({ where: { archivedAt: { not: null } } }),
    db.counsellingBooking.findMany({
      distinct: ["subjectInterest"],
      select: { subjectInterest: true },
      orderBy: { subjectInterest: "asc" },
    }),
    db.counsellingBooking.findMany({
      distinct: ["educationLevel"],
      select: { educationLevel: true },
      orderBy: { educationLevel: "asc" },
    }),
  ]);

  const counts = {
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const c of countsArray) {
    counts[c.status] = c._count;
  }

  return NextResponse.json({
    success: true,
    data: {
      bookings: bookings.map(serializeBooking),
      pagination: paginationMeta(total, page, limit),
      counts: { ...counts, ARCHIVED: archivedCount },
      filters: {
        subjects: subjects.map((item) => item.subjectInterest),
        educationLevels: educationLevels.map((item) => item.educationLevel),
      },
      capabilities: {
        canPermanentlyDelete:
          user.adminRole === "OWNER" || user.adminRole === "ADMIN",
      },
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.COUNSELLING);
  if (error || !user) return error!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = counsellingAdminPatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues[0]?.message || "Invalid data.",
      422,
    );
  }

  const existingBooking = await db.counsellingBooking.findUnique({
    where: { id: parsed.data.id },
  });

  if (!existingBooking) {
    return errorResponse("Booking not found.", 404);
  }

  if (parsed.data.archiveAction) {
    if (
      parsed.data.archiveAction === "archive" &&
      !["COMPLETED", "CANCELLED"].includes(existingBooking.status)
    ) {
      return errorResponse(
        "Only completed or cancelled sessions can be archived.",
        409,
      );
    }

    const booking = await db.counsellingBooking.update({
      where: { id: parsed.data.id },
      data:
        parsed.data.archiveAction === "archive"
          ? { archivedAt: new Date(), archivedById: user.id }
          : { archivedAt: null, archivedById: null },
      include: { files: true },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          parsed.data.archiveAction === "archive"
            ? "Session archived."
            : "Session restored.",
        data: serializeBooking(booking),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (existingBooking.archivedAt) {
    return errorResponse(
      "Archived sessions are read-only. Restore the session before making changes.",
      409,
    );
  }

  let sessionFee = existingBooking.sessionFee;
  let paymentStatus = existingBooking.paymentStatus;
  let feeQuotedAt = existingBooking.feeQuotedAt;
  let paidAt = existingBooking.paidAt;
  let paymentNote = existingBooking.paymentNote;
  let bkashSenderNumber = existingBooking.bkashSenderNumber;
  let bkashTransactionId = existingBooking.bkashTransactionId;
  let paymentProofPublicId = existingBooking.paymentProofPublicId;
  let paymentProofFormat = existingBooking.paymentProofFormat;
  let paymentProofUrl = existingBooking.paymentProofUrl;
  let paymentSubmittedAt = existingBooking.paymentSubmittedAt;

  const feeChanged =
    parsed.data.sessionFee !== undefined && parsed.data.sessionFee !== sessionFee;

  if (parsed.data.sessionFee !== undefined) {
    sessionFee = parsed.data.sessionFee;
    if (sessionFee && sessionFee > 0 && paymentStatus !== "PAID" && paymentStatus !== "WAIVED") {
      paymentStatus = "AWAITING_PAYMENT";
      feeQuotedAt = new Date();
    }
  }

  if (parsed.data.paymentAction === "mark_paid") {
    if (paymentStatus !== "PROOF_SUBMITTED" && paymentStatus !== "AWAITING_PAYMENT") {
      return errorResponse("No payment proof to verify.", 409);
    }
    paymentStatus = "PAID";
    paidAt = new Date();
  }

  if (parsed.data.paymentAction === "waive") {
    paymentStatus = "WAIVED";
    paidAt = new Date();
  }

  if (parsed.data.paymentAction === "reopen_payment") {
    if (paymentProofPublicId) {
      await deletePaymentProof(paymentProofPublicId).catch(console.error);
    }
    paymentStatus = sessionFee && sessionFee > 0 ? "AWAITING_PAYMENT" : "UNQUOTED";
    bkashSenderNumber = null;
    bkashTransactionId = null;
    paymentProofPublicId = null;
    paymentProofFormat = null;
    paymentProofUrl = null;
    paymentSubmittedAt = null;
    paidAt = null;
  }

  if (parsed.data.paymentNote !== undefined) {
    paymentNote = parsed.data.paymentNote;
  }

  const newStatus = parsed.data.status ?? existingBooking.status;

  if (
    newStatus === "CONFIRMED" &&
    !canConfirmCounsellingSession(sessionFee, paymentStatus)
  ) {
    return errorResponse(
      "Cannot confirm session until payment is verified or the fee is waived.",
      422,
    );
  }

  const newMeetingLink =
    parsed.data.meetingLink !== undefined
      ? parsed.data.meetingLink || null
      : existingBooking.meetingLink;
  const newCounsellorNotes =
    parsed.data.counsellorNotes !== undefined
      ? parsed.data.counsellorNotes
      : existingBooking.counsellorNotes;

  const booking = await db.counsellingBooking.update({
    where: { id: parsed.data.id },
    data: {
      status: newStatus,
      meetingLink: newMeetingLink,
      counsellorNotes: newCounsellorNotes,
      sessionFee,
      feeQuotedAt,
      paymentStatus,
      paidAt,
      paymentNote,
      bkashSenderNumber,
      bkashTransactionId,
      paymentProofPublicId,
      paymentProofFormat,
      paymentProofUrl,
      paymentSubmittedAt,
    },
    include: {
      files: true,
    },
  });

  const statusChanged = existingBooking.status !== newStatus;

  if (feeChanged && sessionFee && sessionFee > 0 && booking.userId) {
    await createUserNotification({
      userId: booking.userId,
      title: "Session fee quoted",
      content: `Your counselling session fee is ৳${sessionFee.toLocaleString("en-US")}. Submit bKash payment proof in your portal.`,
      type: "COUNSELLING_FEE_QUOTED",
      category: "ALERT",
      link: "/dashboard?tab=counselling",
    }).catch(console.error);

    sendCounsellingFeeQuotedEmail({
      email: booking.email,
      fullName: booking.fullName,
      sessionFee,
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
    }).catch(console.error);
  }

  if (parsed.data.paymentAction === "mark_paid" && booking.userId) {
    await createUserNotification({
      userId: booking.userId,
      title: "Payment verified",
      content: "Your counselling session payment has been verified. We can now confirm your session.",
      type: "COUNSELLING_PAYMENT_VERIFIED",
      category: "UPDATE",
      link: "/dashboard?tab=counselling",
    }).catch(console.error);

    sendCounsellingPaymentVerifiedEmail({
      email: booking.email,
      fullName: booking.fullName,
      sessionFee: booking.sessionFee,
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
    }).catch(console.error);
  }

  if (parsed.data.paymentAction === "waive" && booking.userId) {
    await createUserNotification({
      userId: booking.userId,
      title: "Session fee waived",
      content: "Your counselling session fee has been waived.",
      type: "COUNSELLING_FEE_WAIVED",
      category: "UPDATE",
      link: "/dashboard?tab=counselling",
    }).catch(console.error);
  }
  
  if (statusChanged && (newStatus === "CONFIRMED" || newStatus === "COMPLETED" || newStatus === "CANCELLED")) {
    // 1. In-app notification
    if (booking.userId) {
      let title = "";
      let content = "";
      
      if (newStatus === "CONFIRMED") {
        title = "Session Confirmed";
        content = `Your session scheduled for ${booking.preferredDate.toLocaleDateString()} at ${booking.preferredTime} has been confirmed.`;
      } else if (newStatus === "COMPLETED") {
        title = "Session Notes Added";
        content = "Your advisor uploaded solved files and post-session guidance. Check your portal.";
      } else if (newStatus === "CANCELLED") {
        title = "Session Cancelled";
        content = `Your session scheduled for ${booking.preferredDate.toLocaleDateString()} has been cancelled.`;
      }

      await createUserNotification({
        userId: booking.userId,
        title,
        content,
        type: `COUNSELLING_${newStatus}`,
        category:
          newStatus === "CONFIRMED" || newStatus === "CANCELLED" ? "ALERT" : "UPDATE",
        link: "/dashboard?tab=counselling",
      }).catch(console.error);
    }

    // 2. Email notification
    sendBookingStatusUpdateEmail({
      email: booking.email,
      fullName: booking.fullName,
      status: newStatus,
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
      meetingLink: newMeetingLink,
    }).catch((err) => {
      console.error("Failed to send status update email:", err);
    });
  }

  return NextResponse.json({
    success: true,
    data: serializeBooking(booking),
  });
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.COUNSELLING);
  if (error || !user) return error!;
  if (user.adminRole !== "OWNER" && user.adminRole !== "ADMIN") {
    return errorResponse(
      "Only an Owner or Admin can permanently delete counselling records.",
      403,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Type DELETE to confirm permanent deletion.", 422);
  }

  const booking = await db.counsellingBooking.findUnique({
    where: { id: parsed.data.id },
    include: { files: { select: { fileKey: true } } },
  });
  if (!booking) return errorResponse("Booking not found.", 404);
  if (!booking.archivedAt) {
    return errorResponse("Archive the session before deleting it permanently.", 409);
  }

  await Promise.all([
    ...booking.files.map((file) =>
      deleteCounsellingFile(file.fileKey).catch(() => undefined),
    ),
    booking.paymentProofPublicId
      ? deletePaymentProof(booking.paymentProofPublicId).catch(() => undefined)
      : Promise.resolve(),
  ]);

  await db.counsellingBooking.delete({ where: { id: booking.id } });

  return NextResponse.json(
    { success: true, message: "Counselling record permanently deleted." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
