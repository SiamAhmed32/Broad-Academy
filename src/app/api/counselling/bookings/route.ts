import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/auth/response";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { calendarMonthRange } from "@/lib/counselling/calendar";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(8),
  search: z.string().trim().max(80).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return errorResponse("Invalid query parameters.", 422);
  }

  const { page, limit, search, status, month } = parsed.data;
  const range = month ? calendarMonthRange(month) : null;
  const skip = (page - 1) * limit;

  const ownershipFilter = {
    OR: [{ userId: user.id }, { email: user.email.toLowerCase() }],
  };

  const where = {
    AND: [
      ownershipFilter,
      ...(range
        ? [
            {
              OR: [
                { scheduledAt: { gte: range.start, lt: range.end } },
                { scheduledAt: null },
              ],
            },
          ]
        : []),
      ...(status ? [{ status }] : []),
      ...(search
        ? [
            {
              OR: [
                {
                  fullName: { contains: search, mode: "insensitive" as const },
                },
                {
                  schoolName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  educationLevel: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                { message: { contains: search, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };

  const countsPromise = db.counsellingBooking.groupBy({
    by: ["status"],
    where: ownershipFilter,
    _count: { status: true },
  });
  const [bookings, total, countsArray] = await Promise.all([
    db.counsellingBooking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        files: {
          select: {
            id: true,
            fileName: true,
            uploadedByRole: true,
            uploadedById: true,
            uploadedByName: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    search || month
      ? db.counsellingBooking.count({ where })
      : countsPromise.then((rows) =>
          rows.reduce(
            (sum, row) =>
              sum + (!status || row.status === status ? row._count.status : 0),
            0,
          ),
        ),
    countsPromise,
  ]);

  const counts = {
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const row of countsArray) {
    counts[row.status] = row._count.status;
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        bookings: bookings.map((booking) => ({
          id: booking.id,
          fullName: booking.fullName,
          schoolName: booking.schoolName,
          classRoll: booking.classRoll,
          studentGroup: booking.studentGroup,
          educationLevel: booking.educationLevel,
          subjectInterest: booking.subjectInterest,
          preferredDate: booking.preferredDate.toISOString(),
          preferredTime: booking.preferredTime,
          scheduledAt: booking.scheduledAt?.toISOString() ?? null,
          archived: Boolean(booking.archivedAt),
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
          hasPaymentProof: Boolean(booking.paymentProofPublicId),
          createdAt: booking.createdAt.toISOString(),
          files: booking.files.map(({ uploadedById, ...file }) => ({
            ...file,
            uploadedByMe: uploadedById === user.id,
            createdAt: file.createdAt.toISOString(),
          })),
        })),
        paymentConfig: {
          bkashNumber: process.env.BKASH_PAYMENT_NUMBER?.trim() || null,
          paymentConfigured: Boolean(process.env.BKASH_PAYMENT_NUMBER?.trim()),
        },
        counts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
