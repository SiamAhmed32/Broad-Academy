import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { buildUnsubscribeToken } from "@/lib/newsletter/unsubscribe";

const schema = z.object({
  email: z.string().trim().email().max(120),
  token: z.string().min(16).max(128).optional(),
});

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid email.", 422);

  const email = parsed.data.email.toLowerCase();
  const subscriber = await db.newsletterSubscriber.findUnique({ where: { email } });
  if (!subscriber) {
    return NextResponse.json({
      success: true,
      message: "If this email was subscribed, it has been removed.",
    });
  }

  if (parsed.data.token) {
    const expected = buildUnsubscribeToken(subscriber.id, subscriber.email);
    if (parsed.data.token !== expected) {
      return errorResponse("Invalid unsubscribe link.", 403);
    }
  }

  await db.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { status: "UNSUBSCRIBED" },
  });

  return NextResponse.json({
    success: true,
    message: "You have been unsubscribed from Broad Academy updates.",
  });
}
