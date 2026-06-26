import type { Prisma } from "@/generated/prisma/client";

type DbClient = Prisma.TransactionClient | { user: Prisma.TransactionClient["user"] };

/**
 * Assigns a student ID on first active enrollment.
 * Format: YY + MM + 4-digit monthly sequence (e.g. 26060001).
 */
export async function ensureStudentId(
  db: DbClient,
  userId: string,
  enrolledAt: Date = new Date(),
): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { studentId: true },
  });

  if (user?.studentId) return user.studentId;

  const yy = String(enrolledAt.getFullYear()).slice(-2);
  const mm = String(enrolledAt.getMonth() + 1).padStart(2, "0");
  const prefix = `${yy}${mm}`;

  const last = await db.user.findFirst({
    where: { studentId: { startsWith: prefix } },
    orderBy: { studentId: "desc" },
    select: { studentId: true },
  });

  const nextSequence = last?.studentId
    ? Number.parseInt(last.studentId.slice(4), 10) + 1
    : 1;

  const studentId = `${prefix}${String(nextSequence).padStart(4, "0")}`;

  await db.user.update({
    where: { id: userId },
    data: { studentId },
  });

  return studentId;
}
