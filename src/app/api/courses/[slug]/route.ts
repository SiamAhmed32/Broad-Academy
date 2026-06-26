import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { fetchCourseBySlug } from "@/lib/courses/fetch";
import { courseSlugSchema } from "@/lib/courses/validation";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const parsed = courseSlugSchema.safeParse((await params).slug);

  if (!parsed.success) {
    return errorResponse("Invalid course identifier.", 422);
  }

  const data = await fetchCourseBySlug(parsed.data);

  if (!data) {
    return errorResponse("Course not found.", 404);
  }

  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
