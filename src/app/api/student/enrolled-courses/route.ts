import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

/** Slugs of courses the signed-in student can open, used by course cards. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: true, data: { slugs: [] } },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
          Vary: "Cookie",
        },
      },
    );
  }

  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    select: { course: { select: { slug: true } } },
  });

  return NextResponse.json(
    { success: true, data: { slugs: enrollments.map((item) => item.course.slug) } },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        Vary: "Cookie",
      },
    },
  );
}
