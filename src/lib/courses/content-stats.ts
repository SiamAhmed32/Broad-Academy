import type { CourseCurriculumSection } from "./types";

type LessonRow = {
  id: string;
  title: string;
  type: "VIDEO" | "READING" | "QUIZ";
  durationSeconds: number;
};

type ModuleRow = {
  title: string;
  lessons: LessonRow[];
};

export function computeCourseContentStats(modules: ModuleRow[]) {
  const lessons = modules.flatMap((module) => module.lessons);
  const lessonCount = lessons.length;
  const totalSeconds = lessons.reduce(
    (sum, lesson) => sum + Math.max(0, lesson.durationSeconds),
    0,
  );
  const durationMinutes =
    lessonCount === 0 ? 0 : Math.max(1, Math.ceil(totalSeconds / 60));
  const videoCount = lessons.filter((lesson) => lesson.type === "VIDEO").length;
  const quizCount = lessons.filter((lesson) => lesson.type === "QUIZ").length;
  const readingCount = lessons.filter((lesson) => lesson.type === "READING").length;

  return {
    lessonCount,
    durationMinutes,
    totalSeconds,
    videoCount,
    quizCount,
    readingCount,
  };
}

export function buildCurriculumFromModules(
  modules: ModuleRow[],
): CourseCurriculumSection[] {
  return modules.map((module) => ({
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      durationSeconds: lesson.durationSeconds,
    })),
  }));
}
