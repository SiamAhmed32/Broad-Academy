import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, MAX_ACTIVE_STUDENT_SESSIONS } from "@/lib/auth/constants";
import { releaseWatchLockForSession } from "@/lib/auth/sessions";
import { isTrustedOrigin, hashValue } from "@/lib/auth/security";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = hashValue(token);
    const session = await db.session.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true },
    });
    if (session) {
      await releaseWatchLockForSession(session.userId, session.id);
    }
    await db.session.deleteMany({
      where: { tokenHash },
    });
  }

  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
