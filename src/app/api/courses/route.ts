import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { fetchCourses } from "@/lib/courses/fetch";
import { courseListQuerySchema } from "@/lib/courses/validation";

export async function GET(request: NextRequest) {
  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = courseListQuerySchema.safeParse(rawParams);

  if (!parsed.success) {
    return errorResponse("Invalid course query parameters.", 422);
  }

  const data = await fetchCourses(parsed.data);

  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
