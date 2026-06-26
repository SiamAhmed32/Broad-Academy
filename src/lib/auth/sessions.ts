import { db } from "@/lib/db";

export async function releaseWatchLockForSession(
  userId: string,
  sessionId: string,
) {
  try {
    await db.learningWatchLock.deleteMany({
      where: { userId, sessionId },
    });
  } catch {
    // Table may not exist before migration patch is applied.
  }
}

export async function revokeStudentSession(
  userId: string,
  sessionId: string,
) {
  await db.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: { id: sessionId, userId },
    });
    try {
      await tx.learningWatchLock.deleteMany({
        where: { userId, sessionId },
      });
    } catch {
      // Table may not exist before migration patch is applied.
    }
  });
}

export async function revokeOtherStudentSessions(
  userId: string,
  currentSessionId: string,
) {
  await db.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });
    try {
      await tx.learningWatchLock.deleteMany({
        where: {
          userId,
          sessionId: { not: currentSessionId },
        },
      });
    } catch {
      // Table may not exist before migration patch is applied.
    }
  });
}
