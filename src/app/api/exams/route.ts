import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db.exam.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      code: true,
      description: true,
      bannerUrl: true,
      price: true,
      originalPrice: true,
      durationMinutes: true,
      totalMarks: true,
      _count: { select: { questions: true } },
    },
  });

  const exams = rows.map(({ _count, ...exam }) => ({
    ...exam,
    questionCount: _count.questions,
  }));

  const freeExams = exams.filter((e) => e.price === 0);
  const paidExams = exams.filter((e) => e.price > 0);

  return NextResponse.json(
    {
      success: true,
      data: { exams, freeExams, paidExams },
    },
    { headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" } },
  );
}
