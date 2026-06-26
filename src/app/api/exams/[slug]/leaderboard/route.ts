import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const exam = await db.exam.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, title: true, totalMarks: true },
  });

  if (!exam) return errorResponse("Exam not found.", 404);

  const entries = await db.examAttempt.findMany({
    where: { examId: exam.id },
    orderBy: [{ score: "desc" }, { timeTakenSec: "asc" }],
    take: 100,
    select: {
      id: true,
      score: true,
      total: true,
      correctQty: true,
      wrongQty: true,
      skippedQty: true,
      timeTakenSec: true,
      submittedAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const leaderboard = entries.map((entry, index) => ({
    rank: index + 1,
    userId: entry.user.id,
    fullName: entry.user.fullName,
    score: entry.score,
    total: entry.total,
    correctQty: entry.correctQty,
    wrongQty: entry.wrongQty,
    skippedQty: entry.skippedQty,
    timeTakenSec: entry.timeTakenSec,
    submittedAt: entry.submittedAt.toISOString(),
    attemptId: entry.id,
  }));

  return NextResponse.json({
    success: true,
    data: {
      exam: {
        id: exam.id,
        title: exam.title,
        totalMarks: exam.totalMarks,
      },
      leaderboard,
    },
  });
}
