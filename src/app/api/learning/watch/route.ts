import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { requireStudentSession } from "@/lib/auth/session";
import {
  claimLearningWatchLock,
  getLearningWatchLockStatus,
  heartbeatLearningWatchLock,
  releaseLearningWatchLock,
} from "@/lib/learning/watch-lock";

const claimSchema = z.object({
  lessonId: z.string().min(1).max(64),
  courseSlug: z.string().min(1).max(120),
  lessonSlug: z.string().min(1).max(120),
});

export async function GET() {
  const auth = await requireStudentSession();
  if (!auth) return errorResponse("Unauthorized.", 401);

  const status = await getLearningWatchLockStatus(auth.user.id, auth.sessionId);
  return NextResponse.json(
    {
      success: true,
      ...status,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const auth = await requireStudentSession();
  if (!auth) return errorResponse("Unauthorized.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid lesson details.", 422);
  }

  const result = await claimLearningWatchLock(
    auth.user.id,
    auth.sessionId,
    parsed.data.lessonId,
    parsed.data.courseSlug,
    parsed.data.lessonSlug,
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        code: result.code,
        message: `Another device (${result.device}) is already playing a lesson video. Sign out that device from Security in your dashboard, or wait about a minute after it stops.`,
        holderDevice: result.device,
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const auth = await requireStudentSession();
  if (!auth) return errorResponse("Unauthorized.", 401);

  const result = await heartbeatLearningWatchLock(auth.user.id, auth.sessionId);
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        code: result.code,
        message:
          result.code === "OTHER_DEVICE"
            ? "Another device took over video playback on your account."
            : "This device no longer holds the active video session.",
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const auth = await requireStudentSession();
  if (!auth) return errorResponse("Unauthorized.", 401);

  await releaseLearningWatchLock(auth.user.id, auth.sessionId);
  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
