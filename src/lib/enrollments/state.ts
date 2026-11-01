import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/lib/auth/session";
import type { EnrollmentRequestStatus } from "./status";

export type EnrollmentState = {
  course: { id: string; slug: string; title: string; price: number };
  hasAccess: boolean;
  enrollmentStatus: string | null;
  request: {
    id: string;
    status: EnrollmentRequestStatus;
    submittedAt: string;
    reviewNote: string | null;
  } | null;
  bkashNumber: string | null;
  paymentConfigured: boolean;
  profilePhone: string | null;
  profileClassLevel: number | null;
};

export type InitialEnrollmentProps = {
  authenticated: boolean;
  state: EnrollmentState | null;
};

export async function getCourseEnrollmentState({
  user,
  course,
  enrollment: initialEnrollment,
  enrollmentRequest: initialEnrollmentRequest,
}: {
  user: AuthenticatedUser | null;
  course: { id: string; slug: string; title: string; price: number };
  enrollment?: { status: string } | null;
  enrollmentRequest?: {
    id: string;
    status: EnrollmentRequestStatus;
    submittedAt: Date | string;
    reviewNote: string | null;
  } | null;
}): Promise<InitialEnrollmentProps> {
  if (!user || user.role !== "STUDENT" || user.status !== "ACTIVE") {
    return {
      authenticated: false,
      state: null,
    };
  }

  const [enrollment, enrollmentRequest] = await Promise.all([
    initialEnrollment !== undefined
      ? initialEnrollment
      : db.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
          select: { status: true },
        }),
    initialEnrollmentRequest !== undefined
      ? initialEnrollmentRequest
      : db.enrollmentRequest.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
          select: {
            id: true,
            status: true,
            submittedAt: true,
            reviewNote: true,
          },
        }),
  ]);

  const bkashNumber = process.env.BKASH_PAYMENT_NUMBER?.trim() || null;

  return {
    authenticated: true,
    state: {
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        price: course.price,
      },
      hasAccess: enrollment?.status === "ACTIVE",
      enrollmentStatus: enrollment?.status ?? null,
      request: enrollmentRequest
        ? {
            id: enrollmentRequest.id,
            status: enrollmentRequest.status,
            submittedAt:
              enrollmentRequest.submittedAt instanceof Date
                ? enrollmentRequest.submittedAt.toISOString()
                : String(enrollmentRequest.submittedAt),
            reviewNote: enrollmentRequest.reviewNote,
          }
        : null,
      bkashNumber,
      paymentConfigured: Boolean(bkashNumber),
      profilePhone: user.phone,
      profileClassLevel: user.classLevel ?? null,
    },
  };
}
