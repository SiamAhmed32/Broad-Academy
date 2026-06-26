import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { getClientIp, hashValue, isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import {
  checkNewsletterRateLimit,
  recordNewsletterAttempt,
} from "@/lib/newsletter/rate-limit";
import { sendNewsletterWelcomeEmail } from "@/lib/newsletter/email";
import { newsletterSchema } from "@/lib/newsletter/validation";

const SUCCESS_MESSAGE =
  "Thanks for subscribing. Check your inbox for updates from Broad Academy.";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  if (Number(request.headers.get("content-length") || 0) > 4_000) {
    return errorResponse("Request is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please enter a valid email address.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const data = parsed.data;

  if (data.website) {
    return NextResponse.json(
      { success: true, message: SUCCESS_MESSAGE },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const ipHash = hashValue(getClientIp(request));
  const rateKey = hashValue(`newsletter:${ipHash}:${data.email}`);
  const rateLimit = await checkNewsletterRateLimit(rateKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many attempts. Please wait and try again later.",
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

  const existing = await db.newsletterSubscriber.findUnique({
    where: { email: data.email },
    select: { id: true, status: true },
  });

  if (existing) {
    if (existing.status === "UNSUBSCRIBED") {
      await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          source: data.source,
          ipHash,
          userAgent,
        },
      });

      void sendNewsletterWelcomeEmail({
        subscriberId: existing.id,
        email: data.email,
        source: data.source,
      }).catch((error) => {
        console.error("Newsletter resubscribe email failed:", error);
      });
    }

    await recordNewsletterAttempt(rateKey);

    return NextResponse.json(
      { success: true, message: SUCCESS_MESSAGE },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const subscriber = await db.newsletterSubscriber.create({
    data: {
      email: data.email,
      source: data.source,
      ipHash,
      userAgent,
    },
  });

  await recordNewsletterAttempt(rateKey);

  void sendNewsletterWelcomeEmail({
    subscriberId: subscriber.id,
    email: data.email,
    source: data.source,
  }).catch((error) => {
    console.error("Newsletter welcome email failed:", error);
  });

  return NextResponse.json(
    { success: true, message: SUCCESS_MESSAGE },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
