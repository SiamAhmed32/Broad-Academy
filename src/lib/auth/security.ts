import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";

import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 7;

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function isTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  return origin === request.nextUrl.origin;
}

export async function checkRateLimit(key: string) {
  const now = new Date();
  const record = await db.authRateLimit.findUnique({ where: { key } });

  if (!record) return { allowed: true, retryAfter: 0 };

  if (record.blockedUntil && record.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000),
    };
  }

  return { allowed: true, retryAfter: 0 };
}

export async function recordFailedAttempt(key: string) {
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
        attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null,
    },
  });
}

export async function clearRateLimit(key: string) {
  await db.authRateLimit.deleteMany({ where: { key } });
}
