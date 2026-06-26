import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { hashValue } from "@/lib/auth/security";

const sessionUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  adminRole: true,
  permissions: true,
  status: true,
  studentId: true,
  avatarUrl: true,
} as const;

export type AuthenticatedUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: "STUDENT" | "ADMIN";
  adminRole: string | null;
  permissions: string[];
  status: "ACTIVE" | "SUSPENDED";
  studentId: string | null;
  avatarUrl: string | null;
};

export type AuthenticatedSession = {
  sessionId: string;
  user: AuthenticatedUser;
};

export const getAuthenticatedSession = cache(async (): Promise<AuthenticatedSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashValue(token) },
    select: {
      id: true,
      expiresAt: true,
      lastUsedAt: true,
      user: {
        select: sessionUserSelect,
      },
    },
  });

  if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") {
    return null;
  }

  if (Date.now() - session.lastUsedAt.getTime() > 5 * 60 * 1000) {
    void db.session
      .update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => undefined);
  }

  return {
    sessionId: session.id,
    user: session.user,
  };
});

export const getCurrentUser = cache(async () => {
  const auth = await getAuthenticatedSession();
  return auth?.user ?? null;
});

export async function getCurrentSessionId() {
  const auth = await getAuthenticatedSession();
  return auth?.sessionId ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAuthenticatedSession() {
  const auth = await getAuthenticatedSession();
  if (!auth) redirect("/login");
  return auth;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" || !user.adminRole) redirect("/dashboard");
  return user;
}

export async function getAdminFromRequest() {
  const user = await getCurrentUser();
  if (
    !user ||
    user.role !== "ADMIN" ||
    !user.adminRole ||
    user.status !== "ACTIVE"
  ) {
    return null;
  }
  return user;
}

export async function requireStudentSession() {
  const auth = await getAuthenticatedSession();
  if (!auth || auth.user.role !== "STUDENT") {
    return null;
  }
  return auth;
}
