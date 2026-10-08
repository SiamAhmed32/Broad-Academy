import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { courseScopeWhere, getCourseScope } from "@/lib/admin/course-scope";
import { requireStaffApi } from "@/lib/admin/guard";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTENT_VIEW);
  if (error || !user) return error!;

  const courseId = request.nextUrl.searchParams.get("courseId");
  const scope = await getCourseScope(user);

  const courses = await db.course.findMany({
    where: courseScopeWhere(scope),
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
    orderBy: { title: "asc" },
  });

  const requested = courseId && courses.some((c) => c.id === courseId) ? courseId : null;
  const selectedCourseId = requested || courses[0]?.id || null;
  if (!selectedCourseId) {
    return NextResponse.json(
      { success: true, data: { courses, course: null, selectedCourseId: null } },
      { headers: { "Cache-Control": "private, max-age=20, stale-while-revalidate=60" } },
    );
  }

  const course = await db.course.findUnique({
    where: { id: selectedCourseId },
    select: {
      id: true,
      modules: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          title: true,
          label: true,
          displayOrder: true,
          lessons: {
            orderBy: { displayOrder: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              description: true,
              youtubeVideoId: true,
              durationSeconds: true,
              content: true,
              isPreview: true,
              quiz: {
                select: { id: true, _count: { select: { questions: true } } },
              },
              resources: {
                orderBy: { displayOrder: "asc" },
                select: { id: true, title: true, url: true, displayOrder: true },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(
    { success: true, data: { courses, course, selectedCourseId } },
    { headers: { "Cache-Control": "private, max-age=20, stale-while-revalidate=60" } },
  );
}
