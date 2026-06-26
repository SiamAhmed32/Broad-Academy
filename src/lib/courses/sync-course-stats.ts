import { db } from "@/lib/db";

import { computeCourseContentStats } from "./content-stats";

export async function syncCourseContentStats(courseId: string) {
  const modules = await db.courseModule.findMany({
    where: { courseId },
    orderBy: { displayOrder: "asc" },
    select: {
      title: true,
      lessons: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          durationSeconds: true,
        },
      },
    },
  });

  const stats = computeCourseContentStats(modules);

  await db.course.update({
    where: { id: courseId },
    data: {
      lessonCount: stats.lessonCount,
      durationMinutes: stats.durationMinutes,
    },
  });

  return stats;
}

export async function syncCourseStatsForModule(moduleId: string) {
  const module = await db.courseModule.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!module) return;
  await syncCourseContentStats(module.courseId);
}

export async function syncCourseStatsForLesson(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) return;
  await syncCourseContentStats(lesson.module.courseId);
}
