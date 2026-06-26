import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const exams = await db.exam.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startsAt: "desc" },
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
      startsAt: true,
      endsAt: true,
    },
  });

  const freeExams = exams.filter((e) => e.price === 0);
  const paidExams = exams.filter((e) => e.price > 0);

  return NextResponse.json(
    {
      success: true,
      data: { freeExams, paidExams },
    },
    { headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" } },
  );
}
