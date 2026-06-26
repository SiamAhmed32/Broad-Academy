import { db } from "@/lib/db";

export function activeEnrollmentFilter(userId: string) {
  return {
    userId,
    status: "ACTIVE" as const,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

export async function hasActiveEnrollment(userId: string) {
  const count = await db.enrollment.count({
    where: activeEnrollmentFilter(userId),
  });
  return count > 0;
}

export async function getEnrolledStudentUserIds() {
  const rows = await db.enrollment.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      user: { role: "STUDENT", status: "ACTIVE" },
    },
    distinct: ["userId"],
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
}
