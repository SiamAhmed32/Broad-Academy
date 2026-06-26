import { db } from "@/lib/db";
import type {
  EnrolledCourseSummary,
  LearningRoomData,
  PublicQuiz,
} from "./types";

function activeEnrollmentWhere(userId: string, courseSlug?: string) {
  return {
    userId,
    status: "ACTIVE" as const,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    ...(courseSlug
      ? { course: { slug: courseSlug, status: "PUBLISHED" as const } }
      : {}),
  };
}

export async function getEnrolledCourses(
  userId: string,
): Promise<EnrolledCourseSummary[]> {
  const enrollments = await db.enrollment.findMany({
    where: activeEnrollmentWhere(userId),
    select: {
      lastLessonId: true,
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          subject: true,
          thumbnailUrl: true,
          instructorName: true,
          modules: {
            orderBy: { displayOrder: "asc" },
            select: {
              lessons: {
                orderBy: { displayOrder: "asc" },
                select: {
                  id: true,
                  slug: true,
                  progress: {
                    where: { userId },
                    select: { completed: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { lastAccessedAt: "desc" },
  });

  return enrollments.map(({ course, lastLessonId }) => {
    const lessons = course.modules.flatMap((module) => module.lessons);
    const completedLessons = lessons.filter(
      (lesson) => lesson.progress[0]?.completed,
    ).length;
    const firstIncomplete =
      lessons.find((lesson) => !lesson.progress[0]?.completed) ?? lessons[0];
    const lastLesson = lessons.find((lesson) => lesson.id === lastLessonId);

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subject: course.subject,
      thumbnailUrl: course.thumbnailUrl,
      instructorName: course.instructorName,
      completedLessons,
      totalLessons: lessons.length,
      progressPercent: lessons.length
        ? Math.round((completedLessons / lessons.length) * 100)
        : 0,
      continueLessonSlug: lastLesson?.slug ?? firstIncomplete?.slug ?? null,
    };
  });
}

export async function getFirstEnrolledLesson(userId: string, courseSlug: string) {
  const enrollment = await db.enrollment.findFirst({
    where: activeEnrollmentWhere(userId, courseSlug),
    select: {
      lastLessonId: true,
      course: {
        select: {
          modules: {
            orderBy: { displayOrder: "asc" },
            select: {
              lessons: {
                orderBy: { displayOrder: "asc" },
                select: { id: true, slug: true },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) return { access: false as const, lessonSlug: null };
  const lessons = enrollment.course.modules.flatMap((module) => module.lessons);
  const selected =
    lessons.find((lesson) => lesson.id === enrollment.lastLessonId) ?? lessons[0];
  return { access: true as const, lessonSlug: selected?.slug ?? null };
}

export async function getLearningRoom(
  userId: string,
  courseSlug: string,
  lessonSlug: string,
): Promise<LearningRoomData | null> {
  const enrollment = await db.enrollment.findFirst({
    where: activeEnrollmentWhere(userId, courseSlug),
    select: {
      id: true,
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          subject: true,
          instructorName: true,
          thumbnailUrl: true,
          modules: {
            orderBy: { displayOrder: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              displayOrder: true,
              lessons: {
                orderBy: { displayOrder: "asc" },
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  description: true,
                  type: true,
                  youtubeVideoId: true,
                  durationSeconds: true,
                  content: true,
                  displayOrder: true,
                  resources: {
                    orderBy: { displayOrder: "asc" },
                    select: { id: true, title: true, url: true },
                  },
                  progress: {
                    where: { userId },
                    select: {
                      completed: true,
                      watchedSeconds: true,
                      lastPositionSec: true,
                    },
                    take: 1,
                  },
                  quiz: {
                    select: {
                      id: true,
                      title: true,
                      description: true,
      passPercent: true,
      timeLimitSeconds: true,
      questions: {
                        orderBy: { displayOrder: "asc" },
                        select: {
                          id: true,
                          prompt: true,
                          options: {
                            orderBy: { displayOrder: "asc" },
                            select: { id: true, text: true },
                          },
                        },
                      },
                      attempts: {
                        where: { userId },
                        orderBy: { submittedAt: "desc" },
                        select: {
                          score: true,
                          total: true,
                          percentage: true,
                          passed: true,
                        },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) return null;

  const modules = enrollment.course.modules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      durationSeconds: lesson.durationSeconds,
      content: lesson.content,
      displayOrder: lesson.displayOrder,
      resources: lesson.resources.filter((resource) => isSafeResourceUrl(resource.url)),
      completed: lesson.progress[0]?.completed ?? false,
      watchedSeconds: lesson.progress[0]?.watchedSeconds ?? 0,
      lastPositionSec: lesson.progress[0]?.lastPositionSec ?? 0,
    })),
  }));
  const rawLessons = enrollment.course.modules.flatMap((module) => module.lessons);
  const lessons = modules.flatMap((module) => module.lessons);
  const currentIndex = lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  if (currentIndex < 0) return null;

  const currentRaw = rawLessons.find((lesson) => lesson.slug === lessonSlug);
  const currentLesson = {
    ...lessons[currentIndex],
    youtubeVideoId: currentRaw?.youtubeVideoId ?? null,
  };
  const completed = lessons.filter((lesson) => lesson.completed).length;
  const quizData = currentRaw?.quiz;
  const quiz: PublicQuiz | null = quizData
    ? {
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        passPercent: quizData.passPercent,
        timeLimitSeconds: quizData.timeLimitSeconds,
        questions: quizData.questions,
        latestAttempt: quizData.attempts[0] ?? null,
      }
    : null;

  await db.enrollment.update({
    where: { id: enrollment.id },
    data: { lastAccessedAt: new Date(), lastLessonId: currentLesson.id },
  });

  return {
    enrollmentId: enrollment.id,
    course: {
      id: enrollment.course.id,
      slug: enrollment.course.slug,
      title: enrollment.course.title,
      subject: enrollment.course.subject,
      instructorName: enrollment.course.instructorName,
      thumbnailUrl: enrollment.course.thumbnailUrl,
    },
    modules,
    currentLesson,
    previousLesson:
      currentIndex > 0
        ? { slug: lessons[currentIndex - 1].slug, title: lessons[currentIndex - 1].title }
        : null,
    nextLesson:
      currentIndex < lessons.length - 1
        ? { slug: lessons[currentIndex + 1].slug, title: lessons[currentIndex + 1].title }
        : null,
    quiz,
    progress: {
      completed,
      total: lessons.length,
      percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    },
  };
}

export async function userCanAccessLesson(userId: string, lessonId: string) {
  return db.enrollment.findFirst({
    where: {
      ...activeEnrollmentWhere(userId),
      course: { modules: { some: { lessons: { some: { id: lessonId } } } } },
    },
    select: { id: true },
  });
}

function isSafeResourceUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
