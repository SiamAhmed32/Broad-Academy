import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { MAX_ACTIVE_STUDENT_SESSIONS } from "@/lib/auth/constants";
import { establishUserSession } from "@/lib/auth/establish-session";
import { applySessionCookie } from "@/lib/auth/session-cookie";
import { errorResponse } from "@/lib/auth/response";
import {
  checkRateLimit,
  clearRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
  recordFailedAttempt,
} from "@/lib/auth/security";
import { loginSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";

const DUMMY_PASSWORD_HASH =
  "$2b$12$EOSJiN.iEq4iawRbvITWXOK4YgHQycJu6QJtRhxE7vzdTypbZM0ri";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  if (Number(request.headers.get("content-length") || 0) > 8_000) {
    return errorResponse("Request is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const { email, password, rememberMe } = parsed.data;
  const ipHash = hashValue(getClientIp(request));
  const rateKey = hashValue(`login:${ipHash}:${email}`);
  const rateLimit = await checkRateLimit(rateKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many login attempts. Please wait and try again.",
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

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      role: true,
    },
  });

  if (user && !user.passwordHash) {
    await recordFailedAttempt(rateKey);
    return errorResponse(
      "This account uses Google. Please continue with Google.",
      401,
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash || DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches || user.status !== "ACTIVE") {
    await recordFailedAttempt(rateKey);
    return errorResponse("The email or password you entered is incorrect.", 401);
  }

  const { sessionToken, expiresAt, signedOutOldestDevice } =
    await establishUserSession({
      userId: user.id,
      role: user.role,
      request,
      rememberMe,
    });

  await clearRateLimit(rateKey);

  const response = NextResponse.json(
    {
      success: true,
      message: signedOutOldestDevice
        ? `Welcome back. Your oldest signed-in device was signed out to keep the ${MAX_ACTIVE_STUDENT_SESSIONS}-device limit.`
        : "Welcome back.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );

  applySessionCookie(
    response,
    sessionToken,
    request,
    rememberMe ? expiresAt : undefined,
  );

  return response;
}
