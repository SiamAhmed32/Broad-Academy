import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import {
  revokeOtherStudentSessions,
  revokeStudentSession,
} from "@/lib/auth/sessions";
import { requireStudentSession } from "@/lib/auth/session";

const revokeSchema = z.object({
  sessionId: z.string().min(1).max(64),
});

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

  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid session.", 422);
  }

  if (parsed.data.sessionId === auth.sessionId) {
    return errorResponse(
      "Use Sign out to end this device. Choose another session to revoke.",
      400,
    );
  }

  await revokeStudentSession(auth.user.id, parsed.data.sessionId);

  return NextResponse.json(
    {
      success: true,
      message: "That device has been signed out.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const auth = await requireStudentSession();
  if (!auth) return errorResponse("Unauthorized.", 401);

  await revokeOtherStudentSessions(auth.user.id, auth.sessionId);

  return NextResponse.json(
    {
      success: true,
      message: "All other devices have been signed out.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
