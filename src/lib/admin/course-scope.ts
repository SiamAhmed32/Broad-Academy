import type { AdminStaffRole } from "@/generated/prisma/client";
import { isCourseScopedRole } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";

type ScopedUser = { id: string; adminRole: AdminStaffRole | null };

/**
 * Course ids a staff member may work with, or null when they are not limited
 * (everyone except teachers, who only see their assigned courses).
 */
export async function getCourseScope(user: ScopedUser): Promise<string[] | null> {
  if (!isCourseScopedRole(user.adminRole)) return null;
  const rows = await db.courseTeacher.findMany({
    where: { userId: user.id },
    select: { courseId: true },
  });
  return rows.map((row) => row.courseId);
}

/** Prisma `where` fragment limiting a Course query to the user's scope. */
export function courseScopeWhere(scope: string[] | null) {
  return scope ? { id: { in: scope } } : {};
}

export async function canAccessCourse(user: ScopedUser, courseId: string | null | undefined) {
  if (!courseId) return false;
  const scope = await getCourseScope(user);
  return scope === null || scope.includes(courseId);
}

/** Returns a 403 response when the user may not edit this course, otherwise null. */
export async function courseAccessError(user: ScopedUser, courseId: string | null | undefined) {
  if (await canAccessCourse(user, courseId)) return null;
  return errorResponse("You can only manage the courses you are assigned to.", 403);
}

export async function courseIdForModule(moduleId: string) {
  const row = await db.courseModule.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  return row?.courseId ?? null;
}

export async function courseIdForLesson(lessonId: string) {
  const row = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  return row?.module.courseId ?? null;
}

export async function courseIdForResource(resourceId: string) {
  const row = await db.lessonResource.findUnique({
    where: { id: resourceId },
    select: { lesson: { select: { module: { select: { courseId: true } } } } },
  });
  return row?.lesson.module.courseId ?? null;
}
