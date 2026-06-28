import { db } from "@/lib/db";
import { activeEnrollmentFilter } from "@/lib/students/access";
import type { NavSession } from "./types";

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  studentId?: string | null;
  avatarUrl?: string | null;
};

export async function getNavSession(user: SessionUser): Promise<NavSession> {
  if (user.role === "ADMIN") {
    const unreadCount = await db.notification.count({
      where: {
        userId: user.id,
        archived: false,
        read: false,
      },
    });

    return {
      fullName: user.fullName,
      email: user.email,
      avatarUrl: null,
      role: "ADMIN",
      hasEnrollment: false,
      canViewNotifications: true,
      studentId: null,
      unreadCount,
    };
  }

  const enrollmentWhere = activeEnrollmentFilter(user.id);

  const [enrollmentCount, unreadCount] = await Promise.all([
    db.enrollment.count({ where: enrollmentWhere }),
    db.notification.count({
      where: {
        userId: user.id,
        archived: false,
        read: false,
      },
    }),
  ]);

  const hasEnrollment = enrollmentCount > 0;

  return {
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    role: "STUDENT",
    hasEnrollment,
    canViewNotifications: hasEnrollment,
    studentId: user.studentId ?? null,
    unreadCount: hasEnrollment ? unreadCount : 0,
  };
}
