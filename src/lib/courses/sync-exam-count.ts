import { db } from "@/lib/db";

export async function syncCourseExamCount(courseId: string | null | undefined) {
  if (!courseId) return;

  const examCount = await db.exam.count({
    where: { courseId, status: "PUBLISHED" },
  });

  await db.course.update({
    where: { id: courseId },
    data: { examCount },
  });
}
