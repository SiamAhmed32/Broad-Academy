import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { scorePercent } from "@/lib/exams/monitoring";

/** Number of most recent attempts plotted on the performance trend chart. */
const TREND_POINTS = 10;

export type ExamMonitoringFilters = {
  search?: string;
  classLevel?: number;
  courseId?: string;
  examId?: string;
  /** Calendar day (YYYY-MM-DD) the attempt was submitted on. */
  date?: string;
};

export type ExamMonitoringRow = {
  attemptId: string;
  studentUserId: string;
  studentName: string;
  studentCode: string | null;
  avatarUrl: string | null;
  classLevel: number | null;
  courseTitle: string | null;
  examId: string;
  examTitle: string;
  score: number;
  total: number;
  timeTakenSec: number;
  submittedAt: Date;
};

export type ExamMonitoringSummary = {
  totalExams: number;
  totalStudents: number;
  totalResults: number;
};

export type ExamMonitoringFilterOptions = {
  classLevels: number[];
  courses: { id: string; title: string }[];
  exams: { id: string; title: string }[];
};

/**
 * Resolves a `YYYY-MM-DD` filter value into a half-open submittedAt range.
 *
 * Dates are interpreted in the server timezone, which is what an operator
 * picking "today" in the admin panel expects.
 */
function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
}

function buildAttemptWhere(
  filters: ExamMonitoringFilters,
): Prisma.ExamAttemptWhereInput {
  const search = filters.search?.trim();
  const range = filters.date ? dayRange(filters.date) : null;

  return {
    ...(filters.examId ? { examId: filters.examId } : {}),
    ...(range ? { submittedAt: range } : {}),
    user: {
      role: "STUDENT",
      ...(filters.classLevel ? { classLevel: filters.classLevel } : {}),
      ...(filters.courseId
        ? { enrollments: { some: { courseId: filters.courseId } } }
        : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { studentId: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
  };
}

/**
 * One page of the exam monitoring table.
 *
 * Each row is a single submitted attempt, newest first — the operator is
 * watching results land, not browsing a student roster.
 */
export async function loadExamMonitoringRows(
  filters: ExamMonitoringFilters,
  { skip, take }: { skip: number; take: number },
): Promise<{ rows: ExamMonitoringRow[]; total: number }> {
  const where = buildAttemptWhere(filters);

  const [attempts, total] = await Promise.all([
    db.examAttempt.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        userId: true,
        examId: true,
        score: true,
        total: true,
        timeTakenSec: true,
        submittedAt: true,
        exam: { select: { title: true } },
        user: {
          select: {
            fullName: true,
            studentId: true,
            avatarUrl: true,
            classLevel: true,
            enrollments: {
              // The course column shows the enrolment the operator filtered
              // on when there is one, otherwise the earliest course.
              ...(filters.courseId ? { where: { courseId: filters.courseId } } : {}),
              orderBy: { enrolledAt: "asc" },
              take: 1,
              select: { course: { select: { title: true } } },
            },
          },
        },
      },
    }),
    db.examAttempt.count({ where }),
  ]);

  const rows = attempts.map((attempt) => ({
    attemptId: attempt.id,
    studentUserId: attempt.userId,
    studentName: attempt.user.fullName,
    studentCode: attempt.user.studentId,
    avatarUrl: attempt.user.avatarUrl,
    classLevel: attempt.user.classLevel,
    courseTitle: attempt.user.enrollments[0]?.course.title ?? null,
    examId: attempt.examId,
    examTitle: attempt.exam.title,
    score: attempt.score,
    total: attempt.total,
    timeTakenSec: attempt.timeTakenSec,
    submittedAt: attempt.submittedAt,
  }));

  return { rows, total };
}

/**
 * All-time totals for the three summary cards.
 *
 * Deliberately unfiltered: the cards describe the whole academy so they stay
 * stable while the operator moves through filters.
 */
export async function loadExamMonitoringSummary(): Promise<ExamMonitoringSummary> {
  const [totalExams, totalStudents, totalResults] = await Promise.all([
    db.exam.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.examAttempt.count(),
  ]);

  return { totalExams, totalStudents, totalResults };
}

/**
 * Dropdown options, drawn from the full population rather than the current
 * page so the selects do not shift as filters are applied.
 */
export async function loadExamMonitoringFilterOptions(): Promise<ExamMonitoringFilterOptions> {
  const [classGroups, courses, exams] = await Promise.all([
    db.user.groupBy({
      by: ["classLevel"],
      where: { role: "STUDENT", classLevel: { not: null } },
      orderBy: { classLevel: "asc" },
    }),
    db.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    db.exam.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  return {
    classLevels: classGroups
      .map((group) => group.classLevel)
      .filter((value): value is number => typeof value === "number"),
    courses,
    exams,
  };
}

export type ExamAttemptQuestionSummary = {
  totalQuestions: number;
  correct: number;
  wrong: number;
  unanswered: number;
};

export type StudentExamOverview = {
  student: {
    id: string;
    fullName: string;
    studentCode: string | null;
    email: string;
    avatarUrl: string | null;
    classLevel: number | null;
    courseTitle: string | null;
    courseTitles: string[];
  };
  stats: {
    totalExams: number;
    averagePercent: number;
    highestScore: { score: number; total: number } | null;
    lowestScore: { score: number; total: number } | null;
  };
  /** Oldest to newest, so the chart reads left to right. */
  trend: { attemptId: string; label: string; percent: number }[];
  history: {
    attemptId: string;
    examTitle: string;
    subject: string;
    submittedAt: Date;
    score: number;
    total: number;
  }[];
  /** The attempt the operator clicked "View" on, when one was requested. */
  focusAttempt: {
    attemptId: string;
    examTitle: string;
    subject: string;
    submittedAt: Date;
    score: number;
    total: number;
    timeTakenSec: number;
    questionSummary: ExamAttemptQuestionSummary;
  } | null;
};

/**
 * Question counts are snapshotted on the attempt at submit time, so they stay
 * correct even after the exam questions are edited. Older rows written before
 * those columns existed fall back to the current question count.
 */
function questionSummaryFor(attempt: {
  correctQty: number;
  wrongQty: number;
  skippedQty: number;
  exam: { _count: { questions: number } };
}): ExamAttemptQuestionSummary {
  const graded = attempt.correctQty + attempt.wrongQty + attempt.skippedQty;
  const totalQuestions = graded > 0 ? graded : attempt.exam._count.questions;

  return {
    totalQuestions,
    correct: attempt.correctQty,
    wrong: attempt.wrongQty,
    unanswered:
      graded > 0
        ? attempt.skippedQty
        : Math.max(0, totalQuestions - attempt.correctQty - attempt.wrongQty),
  };
}

/**
 * Everything the Student Exam Overview screen renders: the student header,
 * all-exam statistics, the performance trend, the full exam history and the
 * question breakdown for one focused attempt.
 */
export async function loadStudentExamOverview(
  userId: string,
  focusAttemptId: string | null,
): Promise<StudentExamOverview | null> {
  const [student, attempts] = await Promise.all([
    db.user.findFirst({
      where: { id: userId, role: "STUDENT" },
      select: {
        id: true,
        fullName: true,
        studentId: true,
        email: true,
        avatarUrl: true,
        classLevel: true,
        enrollments: {
          orderBy: { enrolledAt: "asc" },
          select: { course: { select: { title: true } } },
        },
      },
    }),
    db.examAttempt.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        score: true,
        total: true,
        correctQty: true,
        wrongQty: true,
        skippedQty: true,
        timeTakenSec: true,
        submittedAt: true,
        exam: {
          select: {
            title: true,
            code: true,
            _count: { select: { questions: true } },
          },
        },
      },
    }),
  ]);

  if (!student) return null;

  const courseTitles = student.enrollments.map((item) => item.course.title);

  const percents = attempts.map((attempt) => scorePercent(attempt.score, attempt.total));
  const averagePercent =
    percents.length === 0
      ? 0
      : Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length);

  // Best and worst are ranked by percentage so exams with different total
  // marks compare fairly, but reported as the raw obtained/total pair.
  const ranked = attempts
    .map((_attempt, index) => ({ index, percent: percents[index] }))
    .sort((a, b) => a.percent - b.percent);
  const lowest = ranked.length > 0 ? attempts[ranked[0].index] : null;
  const highest = ranked.length > 0 ? attempts[ranked[ranked.length - 1].index] : null;

  const trend = attempts
    .slice(0, TREND_POINTS)
    .reverse()
    .map((attempt, index) => ({
      attemptId: attempt.id,
      label: `Exam ${index + 1}`,
      percent: scorePercent(attempt.score, attempt.total),
    }));

  const history = attempts.map((attempt) => ({
    attemptId: attempt.id,
    examTitle: attempt.exam.title,
    subject: attempt.exam.code ?? "—",
    submittedAt: attempt.submittedAt,
    score: attempt.score,
    total: attempt.total,
  }));

  const focused = focusAttemptId
    ? attempts.find((attempt) => attempt.id === focusAttemptId)
    : undefined;

  return {
    student: {
      id: student.id,
      fullName: student.fullName,
      studentCode: student.studentId,
      email: student.email,
      avatarUrl: student.avatarUrl,
      classLevel: student.classLevel,
      courseTitle: courseTitles[0] ?? null,
      courseTitles,
    },
    stats: {
      totalExams: attempts.length,
      averagePercent,
      highestScore: highest ? { score: highest.score, total: highest.total } : null,
      lowestScore: lowest ? { score: lowest.score, total: lowest.total } : null,
    },
    trend,
    history,
    focusAttempt: focused
      ? {
          attemptId: focused.id,
          examTitle: focused.exam.title,
          subject: focused.exam.code ?? "—",
          submittedAt: focused.submittedAt,
          score: focused.score,
          total: focused.total,
          timeTakenSec: focused.timeTakenSec,
          questionSummary: questionSummaryFor(focused),
        }
      : null,
  };
}

/**
 * Same payload as {@link loadStudentExamOverview}, addressed by attempt.
 *
 * The attempt id identifies both the student and the focused attempt, so the
 * monitoring table can link straight through without knowing the user id.
 */
export async function loadStudentExamOverviewByAttempt(
  attemptId: string,
): Promise<StudentExamOverview | null> {
  const focus = await db.examAttempt.findUnique({
    where: { id: attemptId },
    select: { userId: true },
  });
  if (!focus) return null;

  return loadStudentExamOverview(focus.userId, attemptId);
}
