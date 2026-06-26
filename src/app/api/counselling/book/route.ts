import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { getCurrentUser } from "@/lib/auth/session";
import {
  checkRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
  recordFailedAttempt,
} from "@/lib/auth/security";
import { counsellingBookingSchema } from "@/lib/counselling/validation";
import { sendBookingConfirmationEmail } from "@/lib/counselling/email";
import { db } from "@/lib/db";
import { notifyActiveAdmins } from "@/lib/notifications/service";

const MAX_BOOKINGS_PER_EMAIL_PER_DAY = 3;

export async function POST(request: NextRequest) {
  // ── Origin check ──
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  // ── Size guard ──
  if (Number(request.headers.get("content-length") || 0) > 10_000) {
    return errorResponse("Request is too large.", 413);
  }

  // ── Parse body ──
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  // ── Validate ──
  const parsed = counsellingBookingSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors
    );
  }

  const data = parsed.data;

  const user = await getCurrentUser();
  if (user && data.email.toLowerCase() !== user.email.toLowerCase()) {
    return errorResponse(
      "When booking from your account, use your registered email address.",
      422,
      { email: ["Use your account email address."] },
    );
  }

  // ── IP-based rate limiting ──
  const ipHash = hashValue(getClientIp(request));
  const rateKey = hashValue(`counselling:${ipHash}`);
  const rateLimit = await checkRateLimit(rateKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please wait and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // ── Per-email daily limit ──
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const normalizedEmail = data.email.toLowerCase();

  const bookingsToday = await db.counsellingBooking.count({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
      createdAt: { gte: todayStart },
    },
  });

  if (bookingsToday >= MAX_BOOKINGS_PER_EMAIL_PER_DAY) {
    await recordFailedAttempt(rateKey);
    return errorResponse(
      "You have reached the maximum number of bookings for today. Please try again tomorrow.",
      429
    );
  }

  // ── Create booking ──
  const activeBookingWhere = {
    status: { in: ["PENDING", "CONFIRMED"] as ("PENDING" | "CONFIRMED")[] },
    archivedAt: null,
    OR: [
      ...(user ? [{ userId: user.id }] : []),
      { email: normalizedEmail },
    ],
  };

  const existingActiveBooking = await db.counsellingBooking.findFirst({
    where: activeBookingWhere,
    select: { id: true },
  });

  if (existingActiveBooking) {
    return errorResponse(
      "You already have an active counselling request. Complete or cancel it before booking another session.",
      409,
    );
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) || null;
  const preferredDate = new Date(data.preferredDate);

  try {
    const booking = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${normalizedEmail}))`;
      const concurrentActiveBooking = await tx.counsellingBooking.findFirst({
        where: activeBookingWhere,
        select: { id: true },
      });
      if (concurrentActiveBooking) {
        throw new Error("ACTIVE_COUNSELLING_BOOKING_EXISTS");
      }

      return tx.counsellingBooking.create({
        data: {
          fullName: data.fullName,
          email: normalizedEmail,
          phone: data.phone,
          educationLevel: data.educationLevel,
          subjectInterest: data.subjectInterest,
          preferredDate,
          preferredTime: data.preferredTime,
          message: data.message || null,
          ipHash,
          userAgent,
          ...(user ? { userId: user.id } : {}),
        },
      });
    });

    // Send emails in background (don't block response)
    sendBookingConfirmationEmail({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      educationLevel: data.educationLevel,
      subjectInterest: data.subjectInterest,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      message: data.message,
    }).catch((err) => {
      console.error("Failed to send booking emails:", err);
    });

    // Notify admins
    void notifyActiveAdmins({
      title: "New counselling booking",
      content: `${data.fullName} booked a session for ${preferredDate.toLocaleDateString()} at ${data.preferredTime}.`,
      type: "BOOKING_CREATED",
      category: "ALERT",
      link: "/admin/counselling",
    }).catch((err) => {
      console.error("Failed to create admin notifications:", err);
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your counselling request has been submitted. Our team will contact you about session fees and confirmation.",
        bookingId: booking.id,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ACTIVE_COUNSELLING_BOOKING_EXISTS"
    ) {
      return errorResponse(
        "You already have an active counselling request. Complete or cancel it before booking another session.",
        409,
      );
    }
    console.error("Counselling booking error:", error);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
}
