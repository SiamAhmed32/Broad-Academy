import { db } from "@/lib/db";

const WINDOW_MS = 60 * 60 * 1000;
const BLOCK_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS = 5;

export async function checkContactRateLimit(key: string) {
  const now = new Date();
  const record = await db.authRateLimit.findUnique({ where: { key } });

  if (!record) return { allowed: true, retryAfter: 0 };

  if (record.blockedUntil && record.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil(
        (record.blockedUntil.getTime() - now.getTime()) / 1000,
      ),
    };
  }

  return { allowed: true, retryAfter: 0 };
}

export async function recordContactSubmission(key: string) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);
  const existing = await db.authRateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowStart < windowStart) {
    await db.authRateLimit.upsert({
      where: { key },
      update: { attempts: 1, windowStart: now, blockedUntil: null },
      create: { key, attempts: 1, windowStart: now },
    });
    return;
  }

  const attempts = existing.attempts + 1;
  await db.authRateLimit.update({
    where: { key },
    data: {
      attempts,
      blockedUntil:
        attempts >= MAX_SUBMISSIONS
          ? new Date(now.getTime() + BLOCK_MS)
          : null,
    },
  });
}
