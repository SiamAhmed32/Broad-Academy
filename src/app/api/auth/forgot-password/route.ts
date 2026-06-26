import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import {
  checkRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
  recordFailedAttempt,
} from "@/lib/auth/security";
import { generateOtp, hashOtp, otpExpiresAt } from "@/lib/auth/otp";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";
import { sendPasswordResetOtp } from "@/lib/email";

const GENERIC_MESSAGE =
  "If an active account exists for that email, we sent a 6-digit code.";

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

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Enter a valid email address.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const { email } = parsed.data;
  const ipHash = hashValue(getClientIp(request));
  const rateKey = hashValue(`forgot:${ipHash}:${email}`);
  const rateLimit = await checkRateLimit(rateKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: "Please wait before requesting another code." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, fullName: true, status: true },
  });

  if (user?.status === "ACTIVE") {
    const recentOtp = await db.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
      select: { id: true },
    });

    if (!recentOtp) {
      const otp = generateOtp();
      await db.$transaction([
        db.passwordResetOtp.updateMany({
          where: { userId: user.id, consumedAt: null },
          data: { consumedAt: new Date() },
        }),
        db.passwordResetOtp.create({
          data: {
            userId: user.id,
            email,
            otpHash: hashOtp(user.id, otp),
            expiresAt: otpExpiresAt(),
          },
        }),
      ]);

      try {
        await sendPasswordResetOtp({
          email,
          fullName: user.fullName,
          otp,
        });
      } catch (error) {
        console.error("Password reset email failed:", error);
      }
    }
  }

  await recordFailedAttempt(rateKey);

  return NextResponse.json(
    { success: true, message: GENERIC_MESSAGE },
    { headers: { "Cache-Control": "no-store" } },
  );
}
