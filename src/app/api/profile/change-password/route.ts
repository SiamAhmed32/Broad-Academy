import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import {
  checkRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
  recordFailedAttempt,
  clearRateLimit,
} from "@/lib/auth/security";
import { changePasswordSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  // CSRF guard
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  // Content-length guard
  if (Number(request.headers.get("content-length") || 0) > 4_000) {
    return errorResponse("Request is too large.", 413);
  }

  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized.", 401);

  // Per-user rate limit: max 5 attempts per 15-minute window
  const ipHash = hashValue(getClientIp(request));
  const rateKey = hashValue(`change-password:${user.id}:${ipHash}`);
  const rateLimit = await checkRateLimit(rateKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many attempts. Please wait before trying again.",
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  // Fetch full user record with password hash
  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!fullUser) return errorResponse("User not found.", 404);

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, fullUser.passwordHash);
  if (!isValid) {
    await recordFailedAttempt(rateKey);
    return errorResponse("Your current password is incorrect.", 401);
  }

  // Get the current session token to keep this session alive
  const currentToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const currentTokenHash = currentToken ? hashValue(currentToken) : null;

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Update password and invalidate ALL OTHER sessions (security: force re-login on other devices)
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    }),
    db.session.deleteMany({
      where: {
        userId: user.id,
        ...(currentTokenHash
          ? { tokenHash: { not: currentTokenHash } }
          : {}),
      },
    }),
  ]);

  // Clear rate limit on success
  await clearRateLimit(rateKey);

  return NextResponse.json(
    {
      success: true,
      message: "Password changed successfully. Other devices have been signed out.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
