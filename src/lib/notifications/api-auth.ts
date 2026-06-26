import { cache } from "react";
import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { hashValue } from "@/lib/auth/security";
import { db } from "@/lib/db";

/** Lightweight session lookup for notification routes — one DB round trip. */
export const getNotificationUserId = cache(async (): Promise<string | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const now = new Date();
  const session = await db.session.findUnique({
    where: { tokenHash: hashValue(token) },
    select: {
      expiresAt: true,
      userId: true,
      user: {
        select: {
          status: true,
          role: true,
          enrollments: {
            where: {
              status: "ACTIVE",
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt <= now || session.user.status !== "ACTIVE") {
    return null;
  }

  if (session.user.role === "ADMIN") {
    return session.userId;
  }

  if (session.user.enrollments.length === 0) {
    return null;
  }

  return session.userId;
});
