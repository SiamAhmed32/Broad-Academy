import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import {
  checkRateLimit,
  clearRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
  recordFailedAttempt,
} from "@/lib/auth/security";
import { verifyOtp } from "@/lib/auth/otp";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";

const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const { email, otp, password } = parsed.data;
  const ipHash = hashValue(getClientIp(request));
  const rateKey = hashValue(`reset:${ipHash}:${email}`);
  const rateLimit = await checkRateLimit(rateKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many attempts. Please request a new code later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const resetRecord = await db.passwordResetOtp.findFirst({
    where: {
      email,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (
    !resetRecord ||
    resetRecord.attempts >= MAX_OTP_ATTEMPTS ||
    !verifyOtp(resetRecord.userId, otp, resetRecord.otpHash)
  ) {
    if (resetRecord && resetRecord.attempts < MAX_OTP_ATTEMPTS) {
      await db.passwordResetOtp.update({
        where: { id: resetRecord.id },
        data: { attempts: { increment: 1 } },
      });
    }
    await recordFailedAttempt(rateKey);
    return errorResponse("The code is invalid or has expired.", 400, {
      otp: ["Check the code or request a new one."],
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    }),
    db.passwordResetOtp.update({
      where: { id: resetRecord.id },
      data: { consumedAt: new Date() },
    }),
    db.passwordResetOtp.updateMany({
      where: {
        userId: resetRecord.userId,
        id: { not: resetRecord.id },
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    }),
    db.session.deleteMany({
      where: { userId: resetRecord.userId },
    }),
  ]);

  await clearRateLimit(rateKey);

  return NextResponse.json(
    {
      success: true,
      message: "Your password has been changed. You can now log in.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
