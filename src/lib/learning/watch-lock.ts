import { WATCH_LOCK_STALE_SECONDS } from "@/lib/auth/constants";
import { describeDevice } from "@/lib/auth/device";
import { db } from "@/lib/db";

// How long a confirmed "table is missing" answer is trusted before checking
// again, so running the patch SQL takes effect without a redeploy.
const MISSING_TABLE_RECHECK_MS = 5 * 60_000;

let watchLockTableAvailable: boolean | null = null;
let watchLockTableCheckedAt = 0;

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  // P2021: table does not exist. Raw queries report Postgres code 42P01.
  return (
    code === "P2021" ||
    (typeof message === "string" && message.includes("42P01"))
  );
}

/**
 * Whether the watch-lock table exists. Only a definite answer is cached: a
 * transient database error skips the lock for this request alone instead of
 * switching it off for the life of the server.
 */
async function hasWatchLockTable(): Promise<boolean> {
  if (watchLockTableAvailable === true) return true;
  if (
    watchLockTableAvailable === false &&
    Date.now() - watchLockTableCheckedAt < MISSING_TABLE_RECHECK_MS
  ) {
    return false;
  }
  try {
    await db.$queryRaw`SELECT "userId" FROM "LearningWatchLock" LIMIT 1`;
    watchLockTableAvailable = true;
    return true;
  } catch (error) {
    if (isMissingTableError(error)) {
      watchLockTableAvailable = false;
      watchLockTableCheckedAt = Date.now();
    }
    // Never block a class because the lock itself can't be checked.
    return false;
  }
}

function staleBefore() {
  return new Date(Date.now() - WATCH_LOCK_STALE_SECONDS * 1000);
}

/**
 * The holder's session, if it is still signed in. A lock left behind by a
 * device that was signed out (or whose login expired) must not block anyone.
 */
async function findLiveHolder(sessionId: string) {
  const holder = await db.session.findUnique({
    where: { id: sessionId },
    select: { userAgent: true, expiresAt: true },
  });
  return holder && holder.expiresAt > new Date() ? holder : null;
}

export type WatchLockClaimResult =
  | { ok: true }
  | { ok: false; code: "OTHER_DEVICE"; device: string };

/**
 * Take the account's single watch lock for this session. With `takeover`
 * the student chose to play here anyway: the lock moves to this session and
 * the other device pauses on its next heartbeat (it gets OTHER_DEVICE).
 */
export async function claimLearningWatchLock(
  userId: string,
  sessionId: string,
  lessonId: string,
  courseSlug: string,
  lessonSlug: string,
  options: { takeover?: boolean } = {},
): Promise<WatchLockClaimResult> {
  if (!(await hasWatchLockTable())) {
    return { ok: true };
  }

  const now = new Date();

  if (!options.takeover) {
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
      const holder = await findLiveHolder(existing.sessionId);
      if (holder) {
        return {
          ok: false,
          code: "OTHER_DEVICE",
          device: describeDevice(holder.userAgent),
        };
      }
    }
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

  const holder = await findLiveHolder(lock.sessionId);

  return {
    enabled: true,
    ownedByCurrentSession: false,
    blockedByOther: Boolean(holder),
    holderDevice: holder ? describeDevice(holder.userAgent) : null,
  };
}
