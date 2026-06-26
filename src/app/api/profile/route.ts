import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { updateProfileSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

// ─── GET /api/profile ────────────────────────────────────────────────────────
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized.", 401);

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      studentId: true,
      classLevel: true,
      avatarUrl: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!profile) return errorResponse("User not found.", 404);

  return NextResponse.json(
    { success: true, data: profile },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// ─── PATCH /api/profile ───────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  // CSRF guard
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  // Content-length guard
  if (Number(request.headers.get("content-length") || 0) > 4_000) {
    return errorResponse("Request is too large.", 413);
  }

  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please review the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const { fullName, phone } = parsed.data;

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      fullName,
      phone: phone || null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      studentId: true,
      classLevel: true,
      avatarUrl: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    { success: true, message: "Profile updated successfully.", data: updated },
    { headers: { "Cache-Control": "no-store" } },
  );
}
