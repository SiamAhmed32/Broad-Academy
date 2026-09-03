import { db } from "@/lib/db";
import {
  calculateProgressPercent,
  daysSinceActive,
  resolveStudentProgressStatus,
  type StudentProgressStatus,
} from "@/lib/students/progress";

/**
 * Hard ceiling on how many student rows one request will aggregate in memory.
 * Progress status is derived, not stored, so the whole filtered population has
 * to be computed before it can be filtered by status or counted for the summary
 * cards. Well beyond any realistic academy roster; the response reports when it
 * is hit so the caller can narrow the filters.
 */
const MAX_AGGREGATED_STUDENTS = 5_000;

export type StudentCourseProgress = {
  courseId: string;
  courseTitle: string;
  enrolledAt: Date;
  lastAccessedAt: Date | null;
  completedAt: Date | null;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  status: StudentProgressStatus;
};

export type StudentProgressRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  studentId: string | null;
  classLevel: number | null;
  avatarUrl: string | null;
  accountStatus: "ACTIVE" | "SUSPENDED";
  createdAt: Date;
  lastLoginAt: Date | null;
  openRequestCount: number;
  /** Earliest enrollment date, or null when never enrolled. */
  enrolledAt: Date | null;
  courseCount: number;
  /** Course titles, in enrollment order. */
  courseTitles: string[];
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  lastActiveAt: Date | null;
  daysInactive: number | null;
  status: StudentProgressStatus;
};

export type StudentProgressFilters = {
  search?: string;
  courseId?: string;
  classLevel?: number;
};

/**
 * Computes overall learning progress for every student matching `filters`.
 *
 * Runs a fixed number of queries regardless of how many students match, then
 * aggregates in memory because the status buckets are derived values that the
 * database cannot filter or sort on.
 *
 * When `filters.courseId` is set, progress is measured against that course
 * only — matching what the course filter implies.
 */
export async function loadStudentProgress(
  filters: StudentProgressFilters,
  now: Date = new Date(),
): Promise<{ rows: StudentProgressRow[]; truncated: boolean }> {
  const search = filters.search?.trim();

  const studentWhere = {
    role: "STUDENT" as const,
    ...(filters.classLevel ? { classLevel: filters.classLevel } : {}),
    ...(filters.courseId
      ? { enrollments: { some: { courseId: filters.courseId } } }
      : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { studentId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const students = await db.user.findMany({
    where: studentWhere,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      studentId: true,
      classLevel: true,
      avatarUrl: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { enrollmentRequests: true } },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_AGGREGATED_STUDENTS + 1,
  });

  const truncated = students.length > MAX_AGGREGATED_STUDENTS;
  if (truncated) students.pop();

  if (students.length === 0) return { rows: [], truncated: false };

  const studentIds = students.map((student) => student.id);

  const enrollments = await db.enrollment.findMany({
    where: {
      userId: { in: studentIds },
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
    },
    select: {
      userId: true,
      courseId: true,
      enrolledAt: true,
      lastAccessedAt: true,
      completedAt: true,
      course: { select: { title: true } },
    },
    orderBy: { enrolledAt: "asc" },
  });

  const courseIds = [...new Set(enrollments.map((item) => item.courseId))];

  // lessonId -> courseId, which also gives the per-course lesson totals.
  const lessonToCourse = new Map<string, string>();
  const lessonsPerCourse = new Map<string, number>();

  if (courseIds.length > 0) {
    const lessons = await db.lesson.findMany({
      where: { module: { courseId: { in: courseIds } } },
      select: { id: true, module: { select: { courseId: true } } },
    });

    for (const lesson of lessons) {
      const courseId = lesson.module.courseId;
      lessonToCourse.set(lesson.id, courseId);
      lessonsPerCourse.set(courseId, (lessonsPerCourse.get(courseId) ?? 0) + 1);
    }
  }

  // Completed lessons and last learning activity, both scoped to the courses
  // in play.
  const [completedProgress, lastActivity] =
    courseIds.length > 0
      ? await Promise.all([
          db.lessonProgress.findMany({
            where: {
              userId: { in: studentIds },
              completed: true,
              lesson: { module: { courseId: { in: courseIds } } },
            },
            select: { userId: true, lessonId: true },
          }),
          db.lessonProgress.groupBy({
            by: ["userId"],
            where: {
              userId: { in: studentIds },
              lesson: { module: { courseId: { in: courseIds } } },
            },
            _max: { updatedAt: true },
          }),
        ])
      : [[], []];

  const lastLearningActivity = new Map<string, Date>();
  for (const group of lastActivity) {
    if (group._max.updatedAt) lastLearningActivity.set(group.userId, group._max.updatedAt);
  }

  // Group enrollments per student, keeping the set of enrolled course ids so a
  // lesson only counts toward a course the student is actually enrolled in.
  type EnrollmentRecord = (typeof enrollments)[number];
  const enrollmentsByStudent = new Map<string, EnrollmentRecord[]>();
  for (const enrollment of enrollments) {
    const list = enrollmentsByStudent.get(enrollment.userId);
    if (list) list.push(enrollment);
    else enrollmentsByStudent.set(enrollment.userId, [enrollment]);
  }

  const completedByStudentCourse = new Map<string, Map<string, number>>();
  for (const record of completedProgress) {
    const courseId = lessonToCourse.get(record.lessonId);
    if (!courseId) continue;
    let perCourse = completedByStudentCourse.get(record.userId);
    if (!perCourse) {
      perCourse = new Map<string, number>();
      completedByStudentCourse.set(record.userId, perCourse);
    }
    perCourse.set(courseId, (perCourse.get(courseId) ?? 0) + 1);
  }

  const rows = students.map((student) => {
    const studentEnrollments = enrollmentsByStudent.get(student.id) ?? [];
    const perCourseCompleted = completedByStudentCourse.get(student.id);

    let completedLessons = 0;
    let totalLessons = 0;
    let lastAccessed: Date | null = null;

    for (const enrollment of studentEnrollments) {
      totalLessons += lessonsPerCourse.get(enrollment.courseId) ?? 0;
      completedLessons += perCourseCompleted?.get(enrollment.courseId) ?? 0;
      if (
        enrollment.lastAccessedAt &&
        (!lastAccessed || enrollment.lastAccessedAt > lastAccessed)
      ) {
        lastAccessed = enrollment.lastAccessedAt;
      }
    }

    const candidates = [
      student.lastLoginAt,
      lastAccessed,
      lastLearningActivity.get(student.id) ?? null,
    ].filter((value): value is Date => value instanceof Date);

    const lastActiveAt =
      candidates.length > 0
        ? candidates.reduce((latest, value) => (value > latest ? value : latest))
        : null;

    const progressPercent = calculateProgressPercent(completedLessons, totalLessons);
    const daysInactive = daysSinceActive(lastActiveAt, now);

    return {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      studentId: student.studentId,
      classLevel: student.classLevel,
      avatarUrl: student.avatarUrl,
      accountStatus: student.status,
      createdAt: student.createdAt,
      lastLoginAt: student.lastLoginAt,
      openRequestCount: student._count.enrollmentRequests,
      enrolledAt: studentEnrollments[0]?.enrolledAt ?? null,
      courseCount: studentEnrollments.length,
      courseTitles: studentEnrollments.map((enrollment) => enrollment.course.title),
      completedLessons,
      totalLessons,
      progressPercent,
      lastActiveAt,
      daysInactive,
      status: resolveStudentProgressStatus({
        progressPercent,
        totalLessons,
        daysInactive,
      }),
    } satisfies StudentProgressRow;
  });

  return { rows, truncated };
}

/** How many recent quiz/exam attempts the profile page lists. */
const RECENT_ATTEMPT_LIMIT = 5;

/**
 * Full profile for one student: identity, overall and per-course progress, and
 * recent assessment activity. Backs the admin student profile page.
 * Returns null when the id is not an existing student account.
 */
export async function loadStudentProgressDetail(
  studentId: string,
  now: Date = new Date(),
) {
  const student = await db.user.findFirst({
    where: { id: studentId, role: "STUDENT" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      studentId: true,
      classLevel: true,
      avatarUrl: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      emailVerifiedAt: true,
      _count: {
        select: {
          enrollments: true,
          enrollmentRequests: true,
          quizAttempts: true,
          examAttempts: true,
        },
      },
    },
  });

  if (!student) return null;

  const enrollments = await db.enrollment.findMany({
    where: { userId: student.id },
    select: {
      courseId: true,
      enrolledAt: true,
      lastAccessedAt: true,
      completedAt: true,
      course: { select: { id: true, title: true } },
    },
    orderBy: { enrolledAt: "asc" },
  });

  const courseIds = enrollments.map((enrollment) => enrollment.courseId);

  const lessonToCourse = new Map<string, string>();
  const lessonsPerCourse = new Map<string, number>();

  if (courseIds.length > 0) {
    const lessons = await db.lesson.findMany({
      where: { module: { courseId: { in: courseIds } } },
      select: { id: true, module: { select: { courseId: true } } },
    });
    for (const lesson of lessons) {
      const courseId = lesson.module.courseId;
      lessonToCourse.set(lesson.id, courseId);
      lessonsPerCourse.set(courseId, (lessonsPerCourse.get(courseId) ?? 0) + 1);
    }
  }

  const progressRows =
    courseIds.length > 0
      ? await db.lessonProgress.findMany({
          where: {
            userId: student.id,
            lesson: { module: { courseId: { in: courseIds } } },
          },
          select: { lessonId: true, completed: true, updatedAt: true },
        })
      : [];

  const completedPerCourse = new Map<string, number>();
  let lastLearningActivity: Date | null = null;

  for (const row of progressRows) {
    const courseId = lessonToCourse.get(row.lessonId);
    if (!courseId) continue;
    if (row.completed) {
      completedPerCourse.set(courseId, (completedPerCourse.get(courseId) ?? 0) + 1);
    }
    if (!lastLearningActivity || row.updatedAt > lastLearningActivity) {
      lastLearningActivity = row.updatedAt;
    }
  }

  let overallCompleted = 0;
  let overallTotal = 0;
  let lastAccessed: Date | null = null;

  const courses: StudentCourseProgress[] = enrollments.map((enrollment) => {
    const totalLessons = lessonsPerCourse.get(enrollment.courseId) ?? 0;
    const completedLessons = completedPerCourse.get(enrollment.courseId) ?? 0;
    overallTotal += totalLessons;
    overallCompleted += completedLessons;

    if (
      enrollment.lastAccessedAt &&
      (!lastAccessed || enrollment.lastAccessedAt > lastAccessed)
    ) {
      lastAccessed = enrollment.lastAccessedAt;
    }

    const progressPercent = calculateProgressPercent(completedLessons, totalLessons);

    return {
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt,
      completedAt: enrollment.completedAt,
      completedLessons,
      totalLessons,
      progressPercent,
      status: resolveStudentProgressStatus({
        progressPercent,
        totalLessons,
        daysInactive: daysSinceActive(
          enrollment.lastAccessedAt ?? student.lastLoginAt,
          now,
        ),
      }),
    };
  });

  // Recent assessment activity, plus averages across every attempt.
  const [quizAttempts, examAttempts, quizAggregate, examAggregate] = await Promise.all([
    db.quizAttempt.findMany({
      where: { userId: student.id },
      select: {
        id: true,
        score: true,
        total: true,
        percentage: true,
        passed: true,
        submittedAt: true,
        quiz: { select: { title: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: RECENT_ATTEMPT_LIMIT,
    }),
    db.examAttempt.findMany({
      where: { userId: student.id },
      select: {
        id: true,
        score: true,
        total: true,
        correctQty: true,
        wrongQty: true,
        skippedQty: true,
        timeTakenSec: true,
        submittedAt: true,
        exam: { select: { title: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: RECENT_ATTEMPT_LIMIT,
    }),
    db.quizAttempt.aggregate({
      where: { userId: student.id },
      _avg: { percentage: true },
      _count: { _all: true },
    }),
    db.examAttempt.aggregate({
      where: { userId: student.id },
      _sum: { score: true, total: true },
      _count: { _all: true },
    }),
  ]);

  const quizPassedCount = await db.quizAttempt.count({
    where: { userId: student.id, passed: true },
  });

  const examTotalMarks = examAggregate._sum.total ?? 0;
  const examScoredMarks = examAggregate._sum.score ?? 0;

  const candidates = [student.lastLoginAt, lastAccessed, lastLearningActivity].filter(
    (value): value is Date => value instanceof Date,
  );
  const lastActiveAt =
    candidates.length > 0
      ? candidates.reduce((latest, value) => (value > latest ? value : latest))
      : null;

  const progressPercent = calculateProgressPercent(overallCompleted, overallTotal);
  const daysInactive = daysSinceActive(lastActiveAt, now);

  return {
    student: {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      studentId: student.studentId,
      classLevel: student.classLevel,
      avatarUrl: student.avatarUrl,
      accountStatus: student.status,
      createdAt: student.createdAt,
      lastLoginAt: student.lastLoginAt,
      emailVerifiedAt: student.emailVerifiedAt,
      enrolledAt: enrollments[0]?.enrolledAt ?? null,
      counts: student._count,
    },
    assessments: {
      quizzes: {
        attemptCount: quizAggregate._count._all,
        passedCount: quizPassedCount,
        averagePercent: Math.round(quizAggregate._avg.percentage ?? 0),
        recent: quizAttempts.map((attempt) => ({
          id: attempt.id,
          title: attempt.quiz.title,
          score: attempt.score,
          total: attempt.total,
          percentage: attempt.percentage,
          passed: attempt.passed,
          submittedAt: attempt.submittedAt,
        })),
      },
      exams: {
        attemptCount: examAggregate._count._all,
        averagePercent: calculateProgressPercent(examScoredMarks, examTotalMarks),
        recent: examAttempts.map((attempt) => ({
          id: attempt.id,
          title: attempt.exam.title,
          score: attempt.score,
          total: attempt.total,
          correctQty: attempt.correctQty,
          wrongQty: attempt.wrongQty,
          skippedQty: attempt.skippedQty,
          timeTakenSec: attempt.timeTakenSec,
          submittedAt: attempt.submittedAt,
        })),
      },
    },
    overall: {
      completedLessons: overallCompleted,
      totalLessons: overallTotal,
      progressPercent,
      lastActiveAt,
      daysInactive,
      status: resolveStudentProgressStatus({
        progressPercent,
        totalLessons: overallTotal,
        daysInactive,
      }),
    },
    courses,
  };
}
