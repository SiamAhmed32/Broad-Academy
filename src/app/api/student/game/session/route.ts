import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import {
  checkRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
} from "@/lib/auth/security";
import { requireEnrolledStudent } from "@/lib/games/guard";
import { createStudentGameSession, pruneExpiredGameSessions } from "@/lib/games/stats";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await requireEnrolledStudent();
  if (!user) {
    return errorResponse(
      "Enroll in at least one course to start a game session.",
      403,
    );
  }

  const rateKey = hashValue(
    `game-session:${user.id}:${hashValue(getClientIp(request))}`,
  );
  const rateLimit = await checkRateLimit(rateKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many game sessions. Please wait a moment.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    );
  }

  void pruneExpiredGameSessions();

  const session = await createStudentGameSession(user.id);
  if (!session) {
    return errorResponse("Game lounge is not available yet. Try again shortly.", 503);
  }

  return NextResponse.json(
    { success: true, data: session },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
