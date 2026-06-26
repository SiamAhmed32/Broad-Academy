import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { requireEnrolledStudent } from "@/lib/games/guard";
import { getStudentGameStats } from "@/lib/games/stats";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireEnrolledStudent();
  if (!user) {
    return errorResponse(
      "Enroll in at least one course to access brain-break games.",
      403,
    );
  }

  const stats = await getStudentGameStats(user.id);

  return NextResponse.json(
    { success: true, data: stats },
    { headers: { "Cache-Control": "no-store" } },
  );
}
