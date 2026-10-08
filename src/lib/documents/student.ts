import { db } from "@/lib/db";

/** Matches a student's submissions, including older ones saved before userId existed. */
export function studentDocumentsWhere(user: { id: string; email: string }) {
  return {
    OR: [
      { userId: user.id },
      {
        userId: null,
        email: { equals: user.email, mode: "insensitive" as const },
      },
    ],
  };
}

/** Document uploads are only open to students enrolled in at least one course. */
export async function hasActiveEnrollment(userId: string) {
  const count = await db.enrollment.count({
    where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
  });
  return count > 0;
}

export async function getStudentSubmissions(user: { id: string; email: string }) {
  const rows = await db.documentSubmission.findMany({
    where: studentDocumentsWhere(user),
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      documentType: true,
      fileName: true,
      message: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      replyFileUrl: true,
      replyFileName: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    documentType: row.documentType,
    fileName: row.fileName,
    message: row.message,
    status: row.status,
    reviewNote: row.reviewNote,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    hasReplyFile: Boolean(row.replyFileUrl),
    replyFileName: row.replyFileName,
    createdAt: row.createdAt.toISOString(),
  }));
}

export type StudentSubmission = Awaited<ReturnType<typeof getStudentSubmissions>>[number];
