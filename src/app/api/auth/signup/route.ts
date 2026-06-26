import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_DAYS,
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
import { signupSchema } from "@/lib/auth/validation";
import {
  createEmailVerificationToken,
  sendVerificationEmail,
} from "@/lib/auth/email-verification";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  if (Number(request.headers.get("content-length") || 0) > 12_000) {
    return errorResponse("Request is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const { fullName, email, phone, password } = parsed.data;
  const ipHash = hashValue(getClientIp(request));
  const rateKey = hashValue(`signup:${ipHash}:${email}`);
  const rateLimit = await checkRateLimit(rateKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many attempts. Please wait a few minutes and try again.",
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

  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    await recordFailedAttempt(rateKey);
    return errorResponse(
      "An account with this email already exists. Please log in instead.",
      409,
      { email: ["This email is already registered."] },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const sessionToken = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) || null;

  try {
    let createdUserId = "";
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email,
          phone: phone || null,
          passwordHash,
          role: "STUDENT",
          adminRole: null,
          permissions: [],
        },
        select: { id: true },
      });
      createdUserId = user.id;

      await tx.session.create({
        data: {
          tokenHash: hashValue(sessionToken),
          userId: user.id,
          userAgent,
          ipHash,
          expiresAt,
        },
      });
    });

    void (async () => {
      try {
        const token = await createEmailVerificationToken(createdUserId, email);
        await sendVerificationEmail({ email, fullName, token });
      } catch (err) {
        console.error("Verification email failed:", err);
      }
    })();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return errorResponse(
        "An account with this email already exists. Please log in instead.",
        409,
        { email: ["This email is already registered."] },
      );
    }

    console.error("Signup failed:", error);
    return errorResponse("We could not create your account. Please try again.", 500);
  }

  await clearRateLimit(rateKey);

  const response = NextResponse.json(
    { success: true, message: "Your account is ready. Check your email to verify your address." },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });

  return response;
}
