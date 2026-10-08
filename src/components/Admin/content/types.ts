import { CirclePlay, FileText, ListChecks, type LucideIcon } from "lucide-react";

export type LessonType = "VIDEO" | "READING" | "QUIZ";

export type CourseOption = { id: string; title: string; slug: string; status: string };

export type LessonResource = { id: string; title: string; url: string; displayOrder: number };

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  description: string;
  youtubeVideoId?: string | null;
  durationSeconds: number;
  content?: string | null;
  isPreview: boolean;
  resources?: LessonResource[];
  quiz?: { id: string; _count: { questions: number } } | null;
};

export type Module = {
  id: string;
  title: string;
  label: string | null;
  displayOrder: number;
  lessons: Lesson[];
};

export type ContentResponse = {
  courses: CourseOption[];
  course: { modules: Module[] } | null;
  selectedCourseId: string | null;
};

/** Older lessons were saved with this filler when the description was left blank. */
export const PLACEHOLDER_DESCRIPTION = "Lesson content";

export const LESSON_TYPES: Record<
  LessonType,
  { label: string; hint: string; icon: LucideIcon; tone: string }
> = {
  VIDEO: {
    label: "Video",
    hint: "A YouTube video students watch",
    icon: CirclePlay,
    tone: "bg-blue-50 text-blue-600",
  },
  READING: {
    label: "Reading",
    hint: "Text or notes students read",
    icon: FileText,
    tone: "bg-emerald-50 text-emerald-600",
  },
  QUIZ: {
    label: "Quiz / Exam",
    hint: "MCQ questions students answer",
    icon: ListChecks,
    tone: "bg-amber-50 text-amber-600",
  },
};

export function formatMinutes(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function quizHref(courseId: string, lessonId?: string) {
  const params = new URLSearchParams({ courseId });
  if (lessonId) params.set("lessonId", lessonId);
  return `/admin/quizzes?${params.toString()}`;
}
