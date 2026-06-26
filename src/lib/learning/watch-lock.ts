import { WATCH_LOCK_STALE_SECONDS } from "@/lib/auth/constants";
import { describeDevice } from "@/lib/auth/device";
import { db } from "@/lib/db";

let watchLockTableAvailable: boolean | null = null;

async function hasWatchLockTable(): Promise<boolean> {
  if (watchLockTableAvailable !== null) return watchLockTableAvailable;
  try {
    await db.$queryRaw`SELECT "userId" FROM "LearningWatchLock" LIMIT 1`;
    watchLockTableAvailable = true;
  } catch {
    watchLockTableAvailable = false;
  }
  return watchLockTableAvailable;
}

function staleBefore() {
  return new Date(Date.now() - WATCH_LOCK_STALE_SECONDS * 1000);
}

export type WatchLockClaimResult =
  | { ok: true }
  | { ok: false; code: "OTHER_DEVICE"; device: string };

export async function claimLearningWatchLock(
  userId: string,
  sessionId: string,
  lessonId: string,
  courseSlug: string,
  lessonSlug: string,
): Promise<WatchLockClaimResult> {
  if (!(await hasWatchLockTable())) {
    return { ok: true };
  }

  const now = new Date();
  const existing = await db.learningWatchLock.findUnique({
    where: { userId },
    select: {
      sessionId: true,
      lastHeartbeat: true,
    },
  });

  if (
    existing &&
    existing.sessionId !== sessionId &&
    existing.lastHeartbeat > staleBefore()
  ) {
    const holder = await db.session.findUnique({
      where: { id: existing.sessionId },
      select: { userAgent: true },
    });
    return {
      ok: false,
      code: "OTHER_DEVICE",
      device: describeDevice(holder?.userAgent ?? null),
    };
  }

  await db.learningWatchLock.upsert({
    where: { userId },
    create: {
      userId,
      sessionId,
      lessonId,
      courseSlug,
      lessonSlug,
      lastHeartbeat: now,
    },
    update: {
      sessionId,
      lessonId,
      courseSlug,
      lessonSlug,
      lastHeartbeat: now,
    },
  });

  return { ok: true };
}

export type WatchHeartbeatResult =
  | { ok: true }
  | { ok: false; code: "OTHER_DEVICE" | "NOT_OWNER" };

export async function heartbeatLearningWatchLock(
  userId: string,
  sessionId: string,
): Promise<WatchHeartbeatResult> {
  if (!(await hasWatchLockTable())) {
    return { ok: true };
  }

  const lock = await db.learningWatchLock.findUnique({
    where: { userId },
    select: { sessionId: true, lastHeartbeat: true },
  });

  if (!lock) {
    return { ok: false, code: "NOT_OWNER" };
  }

  if (lock.sessionId !== sessionId) {
    if (lock.lastHeartbeat > staleBefore()) {
      return { ok: false, code: "OTHER_DEVICE" };
    }
    return { ok: false, code: "NOT_OWNER" };
  }

  await db.learningWatchLock.update({
    where: { userId },
    data: { lastHeartbeat: new Date() },
  });

  return { ok: true };
}

export async function releaseLearningWatchLock(
  userId: string,
  sessionId: string,
) {
  if (!(await hasWatchLockTable())) return;
  await db.learningWatchLock.deleteMany({
    where: { userId, sessionId },
  });
}

export async function getLearningWatchLockStatus(
  userId: string,
  sessionId: string,
) {
  if (!(await hasWatchLockTable())) {
    return {
      enabled: false,
      ownedByCurrentSession: true,
      blockedByOther: false,
      holderDevice: null as string | null,
    };
  }

  const lock = await db.learningWatchLock.findUnique({
    where: { userId },
    select: {
      sessionId: true,
      lastHeartbeat: true,
    },
  });

  if (!lock || lock.lastHeartbeat <= staleBefore()) {
    return {
      enabled: true,
      ownedByCurrentSession: false,
      blockedByOther: false,
      holderDevice: null,
    };
  }

  if (lock.sessionId === sessionId) {
    return {
      enabled: true,
      ownedByCurrentSession: true,
      blockedByOther: false,
      holderDevice: null,
    };
  }

  const holder = await db.session.findUnique({
    where: { id: lock.sessionId },
    select: { userAgent: true },
  });

  return {
    enabled: true,
    ownedByCurrentSession: false,
    blockedByOther: true,
    holderDevice: describeDevice(holder?.userAgent ?? null),
  };
}
