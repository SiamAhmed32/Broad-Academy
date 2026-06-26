import { NextRequest, NextResponse } from "next/server";

import { sendContactConfirmation, sendContactNotification } from "@/lib/contact/email";
import {
  checkContactRateLimit,
  recordContactSubmission,
} from "@/lib/contact/rate-limit";
import { contactSchema } from "@/lib/contact/validation";
import { errorResponse } from "@/lib/auth/response";
import { getClientIp, hashValue, isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

const SUCCESS_MESSAGE =
  "Thank you. Your message has been sent and our team will respond soon.";

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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const data = parsed.data;
  const ipHash = hashValue(getClientIp(request));

  if (data.website) {
    return NextResponse.json(
      { success: true, message: SUCCESS_MESSAGE },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const rateKey = hashValue(`contact:${ipHash}:${data.email}`);
  const rateLimit = await checkContactRateLimit(rateKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many messages sent recently. Please try again later.",
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

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) || null;

  const message = await db.contactMessage.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
      subject: data.subject,
      message: data.message,
      source: data.source,
      ipHash,
      userAgent,
    },
  });

  await recordContactSubmission(rateKey);

  try {
    await Promise.all([
      sendContactNotification({ ...data, messageId: message.id }),
      sendContactConfirmation({
        email: data.email,
        fullName: data.fullName,
        subject: data.subject,
      }),
    ]);
  } catch (error) {
    console.error("Contact email delivery failed:", error);
  }

  return NextResponse.json(
    { success: true, message: SUCCESS_MESSAGE },
    { headers: { "Cache-Control": "no-store" } },
  );
}
