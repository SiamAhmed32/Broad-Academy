import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import {
  checkRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
} from "@/lib/auth/security";
import { requireEnrolledStudent } from "@/lib/games/guard";
import { recordStudentGameResult } from "@/lib/games/stats";
import { gameResultSchema } from "@/lib/games/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await requireEnrolledStudent();
  if (!user) {
    return errorResponse(
      "Enroll in at least one course to save game results.",
      403,
    );
  }

  const rateKey = hashValue(
    `game-result:${user.id}:${hashValue(getClientIp(request))}`,
  );
  const rateLimit = await checkRateLimit(rateKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many game submissions. Please slow down.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = gameResultSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid game result.", 422);
  }

  const result = await recordStudentGameResult(
    user.id,
    parsed.data.sessionId,
    parsed.data.outcome,
    parsed.data.moves,
  );

  if (!result.ok) {
    if (result.code === "INVALID_SESSION") {
      return errorResponse("This game session expired. Start a new round.", 409);
    }
    if (result.code === "INVALID_MOVES") {
      return errorResponse("Invalid game data.", 422);
    }
    return errorResponse("Game lounge is not available yet.", 503);
  }

  return NextResponse.json(
    { success: true, data: result.stats },
    { headers: { "Cache-Control": "no-store" } },
  );
}
