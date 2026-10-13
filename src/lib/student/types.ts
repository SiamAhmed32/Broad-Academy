import type { EnrolledCourseSummary } from "@/lib/learning/types";
import type { EnrollmentRequestStatus } from "@/lib/enrollments/status";

export type StudentProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  studentId: string | null;
  classLevel: number | null;
  sscBatch: number | null;
  avatarUrl: string | null;
  status: "ACTIVE" | "SUSPENDED";
  emailVerifiedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

export type CounsellingBookingSummary = {
  id: string;
  fullName: string;
  schoolName: string | null;
  classRoll: string | null;
  studentGroup: string | null;
  educationLevel: string;
  subjectInterest: string;
  preferredDate: string;
  preferredTime: string;
  /** Actual session date/time set by the team, or null while not scheduled. */
  scheduledAt: string | null;
  archived: boolean;
  message: string | null;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  meetingLink: string | null;
  counsellorNotes: string | null;
  sessionFee: number | null;
  feeQuotedAt: string | null;
  paymentStatus:
    | "UNQUOTED"
    | "AWAITING_PAYMENT"
    | "PROOF_SUBMITTED"
    | "PAID"
    | "WAIVED";
  bkashSenderNumber: string | null;
  bkashTransactionId: string | null;
  paymentSubmittedAt: string | null;
  paidAt: string | null;
  hasPaymentProof: boolean;
  createdAt: string;
  files: Array<{
    id: string;
    fileName: string;
    uploadedByRole: string;
    uploadedByName: string;
    /** True when the signed-in student shared this file (and may remove it). */
    uploadedByMe: boolean;
    createdAt: string;
  }>;
};

export type StudentPortalData = {
  profile: StudentProfile;
  courses: EnrolledCourseSummary[];
  enrollmentRequests: Array<{
    id: string;
    status: EnrollmentRequestStatus;
    paidAmount: number;
    bkashTransactionId: string;
    submittedAt: string;
    reviewNote: string | null;
    course: {
      title: string;
      slug: string;
      thumbnailUrl: string;
    };
  }>;
  quizAttempts: Array<{
    id: string;
    title: string;
    courseTitle: string;
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    submittedAt: string;
  }>;
  sessions: Array<{
    id: string;
    device: string;
    createdAt: string;
    lastUsedAt: string;
    expiresAt: string;
    isCurrent: boolean;
  }>;
  currentSessionId: string | null;
  devicePolicy: {
    maxSessions: number;
    singleActiveVideo: boolean;
  };
  stats: {
    activeCourses: number;
    completedLessons: number;
    totalLessons: number;
    averageProgress: number;
    quizzesTaken: number;
    averageQuizScore: number;
    pendingEnrollmentRequests: number;
    counsellingCount: number;
  };
  counsellingBookings: CounsellingBookingSummary[];
};
