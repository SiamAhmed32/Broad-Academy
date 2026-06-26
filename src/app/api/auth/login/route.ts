import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_DAYS,
  SHORT_SESSION_HOURS,
  MAX_ACTIVE_STUDENT_SESSIONS,
} from "@/lib/auth/constants";
import { errorResponse } from "@/lib/auth/response";
import {
  checkRateLimit,
  clearRateLimit,
  createSessionToken,
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

  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash || DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches || user.status !== "ACTIVE") {
    await recordFailedAttempt(rateKey);
    return errorResponse("The email or password you entered is incorrect.", 401);
  }

  const sessionToken = createSessionToken();
  const sessionLengthMs = rememberMe
    ? SESSION_DAYS * 24 * 60 * 60 * 1000
    : SHORT_SESSION_HOURS * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + sessionLengthMs);
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) || null;

  let signedOutOldestDevice = false;

  await db.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: { userId: user.id, expiresAt: { lte: new Date() } },
    });
    await tx.session.create({
      data: {
        tokenHash: hashValue(sessionToken),
        userId: user.id,
        userAgent,
        ipHash,
        expiresAt,
      },
    });

    if (user.role === "STUDENT") {
      const staleSessions = await tx.session.findMany({
        where: { userId: user.id },
        orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
        skip: MAX_ACTIVE_STUDENT_SESSIONS,
        select: { id: true },
      });
      if (staleSessions.length) {
        signedOutOldestDevice = true;
        await tx.session.deleteMany({
          where: { id: { in: staleSessions.map((session) => session.id) } },
        });
        try {
          await tx.learningWatchLock.deleteMany({
            where: {
              userId: user.id,
              sessionId: { in: staleSessions.map((session) => session.id) },
            },
          });
        } catch {
          // Table may not exist before migration patch is applied.
        }
      }
    }

    await tx.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
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

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { expires: expiresAt } : {}),
    priority: "high",
  });

  return response;
}
