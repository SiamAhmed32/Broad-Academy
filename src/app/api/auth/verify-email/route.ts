import { NextRequest, NextResponse } from "next/server";

import {
  createEmailVerificationToken,
  sendVerificationEmail,
  verifyEmailToken,
} from "@/lib/auth/email-verification";
import { errorResponse } from "@/lib/auth/response";
import { getCurrentUser } from "@/lib/auth/session";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token")?.trim();
  if (!token) return errorResponse("Verification token is required.", 422);

  const result = await verifyEmailToken(token);
  if (!result.ok) {
    return errorResponse("This verification link is invalid or has expired.", 400);
  }

  return NextResponse.json({
    success: true,
    message: "Your email has been verified successfully.",
  });
}

export async function PUT(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await getCurrentUser();
  if (!user) return errorResponse("Authentication required.", 401);
  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { email: true, fullName: true, emailVerifiedAt: true },
  });
  if (!record) return errorResponse("User not found.", 404);
  if (record.emailVerifiedAt) {
    return NextResponse.json({ success: true, message: "Email already verified." });
  }

  try {
    const token = await createEmailVerificationToken(user.id, record.email);
    await sendVerificationEmail({
      email: record.email,
      fullName: record.fullName,
      token,
    });
  } catch {
    return errorResponse("Could not send verification email. Try again later.", 503);
  }

  return NextResponse.json({
    success: true,
    message: "Verification email sent. Check your inbox.",
  });
}
