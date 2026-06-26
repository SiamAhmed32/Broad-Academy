import { db } from "@/lib/db";
import { describeDevice } from "@/lib/auth/device";
import { MAX_ACTIVE_STUDENT_SESSIONS } from "@/lib/auth/constants";
import { getEnrolledCourses } from "@/lib/learning/queries";
import { isEnrollmentRequestOpen } from "@/lib/enrollments/status";
import type { StudentPortalData } from "./types";

export async function getStudentPortalData(
  userId: string,
  currentSessionId: string | null = null,
): Promise<StudentPortalData | null> {
  const [profile, courses, enrollmentRequests, quizAttempts, sessions, counsellingCount] = await Promise.all([
    db.user.findFirst({
      where: { id: userId, role: "STUDENT" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        studentId: true,
        classLevel: true,
        avatarUrl: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    getEnrolledCourses(userId),
    db.enrollmentRequest.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      take: 30,
      select: {
        id: true,
        status: true,
        paidAmount: true,
        bkashTransactionId: true,
        submittedAt: true,
        reviewNote: true,
        course: {
          select: {
            title: true,
            slug: true,
            thumbnailUrl: true,
          },
        },
      },
    }),
    db.quizAttempt.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      take: 50,
      select: {
        id: true,
        score: true,
        total: true,
        percentage: true,
        passed: true,
        submittedAt: true,
        quiz: {
          select: {
            title: true,
            lesson: {
              select: {
                module: {
                  select: { course: { select: { title: true } } },
                },
              },
            },
          },
        },
      },
    }),
    db.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
      take: 10,
      select: {
        id: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    }),
    db.counsellingBooking.count({ where: { userId } }),
  ]);

  if (!profile) return null;

  const completedLessons = courses.reduce(
    (sum, course) => sum + course.completedLessons,
    0,
  );
  const totalLessons = courses.reduce(
    (sum, course) => sum + course.totalLessons,
    0,
  );
  const averageQuizScore = quizAttempts.length
    ? Math.round(
        quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) /
          quizAttempts.length,
      )
    : 0;

  return {
    profile: {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      emailVerifiedAt: profile.emailVerifiedAt?.toISOString() ?? null,
      lastLoginAt: profile.lastLoginAt?.toISOString() ?? null,
    },
    courses,
    enrollmentRequests: enrollmentRequests.map((request) => ({
      ...request,
      submittedAt: request.submittedAt.toISOString(),
    })),
    quizAttempts: quizAttempts.map((attempt) => ({
      id: attempt.id,
      title: attempt.quiz.title,
      courseTitle: attempt.quiz.lesson.module.course.title,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt.toISOString(),
    })),
    sessions: sessions.map((session) => ({
      id: session.id,
      device: describeDevice(session.userAgent),
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      isCurrent: session.id === currentSessionId,
    })),
    currentSessionId,
    devicePolicy: {
      maxSessions: MAX_ACTIVE_STUDENT_SESSIONS,
      singleActiveVideo: true,
    },
    stats: {
      activeCourses: courses.length,
      completedLessons,
      totalLessons,
      averageProgress: totalLessons
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0,
      quizzesTaken: quizAttempts.length,
      averageQuizScore,
      pendingEnrollmentRequests: enrollmentRequests.filter((request) =>
        isEnrollmentRequestOpen(request.status),
      ).length,
      counsellingCount,
    },
    counsellingBookings: [],
  };
}
