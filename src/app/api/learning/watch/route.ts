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
  // The student pressed "Play here": move playback to this device.
  takeover: z.boolean().optional(),
});

// The player treats this as a temporary problem and keeps playing.
function lockUnavailableResponse() {
  return errorResponse("Playback check is temporarily unavailable.", 503);
}

export async function GET() {
  const auth = await requireStudentSession();
  if (!auth) return errorResponse("Unauthorized.", 401);

  try {
    const status = await getLearningWatchLockStatus(auth.user.id, auth.sessionId);
    return NextResponse.json(
      {
        success: true,
        ...status,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return lockUnavailableResponse();
  }
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

  let result: Awaited<ReturnType<typeof claimLearningWatchLock>>;
  try {
    result = await claimLearningWatchLock(
      auth.user.id,
      auth.sessionId,
      parsed.data.lessonId,
      parsed.data.courseSlug,
      parsed.data.lessonSlug,
      { takeover: parsed.data.takeover === true },
    );
  } catch {
    return lockUnavailableResponse();
  }

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        code: result.code,
        message: `Another device (${result.device}) is already playing a lesson on your account.`,
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

  let result: Awaited<ReturnType<typeof heartbeatLearningWatchLock>>;
  try {
    result = await heartbeatLearningWatchLock(auth.user.id, auth.sessionId);
  } catch {
    return lockUnavailableResponse();
  }

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

  try {
    await releaseLearningWatchLock(auth.user.id, auth.sessionId);
  } catch {
    return lockUnavailableResponse();
  }
  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
