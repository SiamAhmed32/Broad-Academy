import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTENT);
  if (error) return error;

  const courseId = request.nextUrl.searchParams.get("courseId");

  const courses = await db.course.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
    orderBy: { title: "asc" },
  });

  const selectedCourseId = courseId || courses[0]?.id || null;
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
              isPreview: true,
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
