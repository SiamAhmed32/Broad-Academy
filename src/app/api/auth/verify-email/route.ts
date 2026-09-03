import { NextRequest, NextResponse } from "next/server";

import {
  VERIFY_EXPIRY_HOURS,
  createEmailVerificationToken,
  discardEmailVerificationToken,
  retireOtherTokens,
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
    const expired = result.reason === "expired";
    return NextResponse.json(
      {
        success: false,
        reason: result.reason,
        message: expired
          ? `This verification link has expired — they are only valid for ${VERIFY_EXPIRY_HOURS} hours. Send yourself a new one below.`
          : "This verification link is not valid. Send yourself a new one below.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: result.alreadyVerified
      ? "Your email is already verified."
      : "Your email has been verified successfully.",
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

  // Order matters: issue the new token, send, and only then retire the older
  // ones. If the send fails we drop the token we just made, so the user keeps
  // whatever still-valid link they had instead of being left with a token that
  // was never delivered.
  const token = await createEmailVerificationToken(user.id, record.email);
  try {
    await sendVerificationEmail({
      email: record.email,
      fullName: record.fullName,
      token,
    });
  } catch {
    await discardEmailVerificationToken(token);
    return errorResponse("Could not send verification email. Try again later.", 503);
  }
  await retireOtherTokens(user.id, token);

  return NextResponse.json({
    success: true,
    message: "Verification email sent. Check your inbox.",
  });
}
