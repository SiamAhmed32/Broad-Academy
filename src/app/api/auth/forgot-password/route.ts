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

  await recordFailedAttempt(rateKey);

  if (!user || user.status !== "ACTIVE") {
    return errorResponse(
      "No active account found for that email address.",
      404,
    );
  }

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
      return errorResponse(
        "We could not send the reset email. Please try again in a moment.",
        502,
      );
    }
  }

  return NextResponse.json(
    { success: true, message: "We sent a 6-digit code to your email." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
