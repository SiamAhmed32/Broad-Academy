import { NextRequest } from "next/server";

import {
  MAX_ACTIVE_STUDENT_SESSIONS,
  SESSION_DAYS,
  SHORT_SESSION_HOURS,
} from "@/lib/auth/constants";
import { createSessionToken, getClientIp, hashValue } from "@/lib/auth/security";
import { db } from "@/lib/db";

export async function establishUserSession({
  userId,
  role,
  request,
  rememberMe,
}: {
  userId: string;
  role: "STUDENT" | "ADMIN";
  request: NextRequest;
  rememberMe: boolean;
}) {
  const sessionToken = createSessionToken();
  const sessionLengthMs = rememberMe
    ? SESSION_DAYS * 24 * 60 * 60 * 1000
    : SHORT_SESSION_HOURS * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + sessionLengthMs);
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) || null;
  const ipHash = hashValue(getClientIp(request));
  let signedOutOldestDevice = false;

  await db.session.deleteMany({
    where: { userId, expiresAt: { lte: new Date() } },
  });
  await db.session.create({
    data: {
      tokenHash: hashValue(sessionToken),
      userId,
      userAgent,
      ipHash,
      expiresAt,
    },
  });

  if (role === "STUDENT") {
    const staleSessions = await db.session.findMany({
      where: { userId },
      orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
      skip: MAX_ACTIVE_STUDENT_SESSIONS,
      select: { id: true },
    });
    if (staleSessions.length) {
      signedOutOldestDevice = true;
      const staleIds = staleSessions.map((session) => session.id);
      await db.session.deleteMany({
        where: { id: { in: staleIds } },
      });
      try {
        await db.learningWatchLock.deleteMany({
          where: { userId, sessionId: { in: staleIds } },
        });
      } catch {
        // Table may not exist before migration patch is applied.
      }
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  return { sessionToken, expiresAt, signedOutOldestDevice };
}
