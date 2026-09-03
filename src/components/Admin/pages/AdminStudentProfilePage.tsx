"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  AdminAvatar,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminLoading,
} from "@/components/Admin";
import {
  UserAccountModal,
  type WebsiteUserRecord,
} from "@/components/Admin/UserAccountModal";
import {
  StudentProgressBadge,
  StudentProgressBar,
} from "@/components/Admin/ui/StudentProgressBadge";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";
import { formatClassLabel, formatCompletionTime } from "@/lib/exams/monitoring";
import { formatLastActive, type StudentProgressStatus } from "@/lib/students/progress";
import { cn } from "@/lib/utils";

type StudentProfile = {
  student: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    studentId: string | null;
    classLevel: number | null;
    avatarUrl: string | null;
    accountStatus: "ACTIVE" | "SUSPENDED";
    createdAt: string;
    lastLoginAt: string | null;
    emailVerifiedAt: string | null;
    enrolledAt: string | null;
    counts: {
      enrollments: number;
      enrollmentRequests: number;
      quizAttempts: number;
      examAttempts: number;
    };
  };
  overall: {
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
    lastActiveAt: string | null;
    status: StudentProgressStatus;
  };
  courses: Array<{
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    lastAccessedAt: string | null;
    completedAt: string | null;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
    status: StudentProgressStatus;
  }>;
  assessments: {
    quizzes: {
      attemptCount: number;
      passedCount: number;
      averagePercent: number;
      recent: Array<{
        id: string;
        title: string;
        score: number;
        total: number;
        percentage: number;
        passed: boolean;
        submittedAt: string;
      }>;
    };
    exams: {
      attemptCount: number;
      averagePercent: number;
      recent: Array<{
        id: string;
        title: string;
        score: number;
        total: number;
        correctQty: number;
        wrongQty: number;
        skippedQty: number;
        timeTakenSec: number;
        submittedAt: string;
      }>;
    };
  };
};

async function fetchProfile(studentId: string) {
  const res = await adminFetch<StudentProfile>(
    `/api/admin/students/progress/${encodeURIComponent(studentId)}`,
  );
  return res.success && res.data ? res.data : null;
}

export default function AdminStudentProfilePage({ studentId }: { studentId: string }) {
  const shouldReduceMotion = useReducedMotion();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [accountUser, setAccountUser] = useState<WebsiteUserRecord | null>(null);
  const [accountUpdating, setAccountUpdating] = useState(false);
  const [accountAction, setAccountAction] = useState<"suspend" | "approve" | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountFieldErrors, setAccountFieldErrors] = useState<{ message?: string[] }>({});

  const applyResult = useCallback((result: StudentProfile | null) => {
    setProfile(result);
    setNotFound(result === null);
    setLoading(false);
  }, []);

  /** Re-reads the profile after an account change. */
  const refresh = useCallback(async () => {
    applyResult(await fetchProfile(studentId));
  }, [applyResult, studentId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const result = await fetchProfile(studentId);
      if (!cancelled) applyResult(result);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [applyResult, studentId]);

  function openAccountModal() {
    if (!profile) return;
    const { student } = profile;
    const { counts } = student;
    setAccountError(null);
    setAccountFieldErrors({});
    setAccountUser({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      role: "STUDENT",
      adminRole: null,
      status: student.accountStatus,
      studentId: student.studentId,
      createdAt: student.createdAt,
      lastLoginAt: student.lastLoginAt,
      emailVerifiedAt: student.emailVerifiedAt,
      _count: {
        enrollments: counts.enrollments,
        enrollmentRequests: counts.enrollmentRequests,
      },
    });
  }

  async function updateAccountStatus(
    nextStatus: "ACTIVE" | "SUSPENDED",
    message?: string,
  ) {
    if (!accountUser) return;

    setAccountUpdating(true);
    setAccountAction(nextStatus === "SUSPENDED" ? "suspend" : "approve");
    setAccountError(null);
    setAccountFieldErrors({});

    const res = await adminFetch("/api/admin/students", {
      method: "PATCH",
      body: JSON.stringify({
        id: accountUser.id,
        status: nextStatus,
        ...(message ? { message } : {}),
      }),
    });

    setAccountUpdating(false);
    setAccountAction(null);

    if (!res.success) {
      setAccountError(
        res.message ??
          (nextStatus === "SUSPENDED"
            ? "Could not suspend this account."
            : "Could not approve this account."),
      );
      setAccountFieldErrors(res.fields ?? {});
      return;
    }

    setAccountUser(null);
    await refresh();
  }

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 text-slate-400">
          <li>
            <Link href="/admin" className="font-medium text-accent hover:underline">
              Dashboard
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href="/admin/students?tab=progress"
              className="font-medium text-accent hover:underline"
            >
              Students
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-slate-500" aria-current="page">
            Student Profile
          </li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
          Student Profile
        </h1>
        <Link href="/admin/students?tab=progress">
          <AdminButton variant="ghost">
            <ArrowLeft size={15} /> Back to students
          </AdminButton>
        </Link>
      </div>

      {loading ? (
        <AdminLoading label="Loading student profile..." />
      ) : notFound || !profile ? (
        <AdminEmpty
          title="Student not found"
          description="This account may have been removed. Go back to the student list and pick another student."
        />
      ) : (
        <motion.div
          className="space-y-6"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="show"
        >
          {/* Identity + account actions */}
          <motion.div variants={fadeUp}>
            <AdminCard className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <AdminAvatar
                    name={profile.student.fullName}
                    src={profile.student.avatarUrl}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-semibold text-navy">
                        {profile.student.fullName}
                      </h2>
                      <StudentProgressBadge status={profile.overall.status} />
                      <AdminBadge
                        variant={
                          profile.student.accountStatus === "ACTIVE" ? "success" : "danger"
                        }
                      >
                        {profile.student.accountStatus === "ACTIVE"
                          ? "Active"
                          : "Suspended"}
                      </AdminBadge>
                      {profile.student.emailVerifiedAt ? (
                        <AdminBadge variant="info">
                          <BadgeCheck className="mr-1 h-3 w-3" />
                          Verified
                        </AdminBadge>
                      ) : (
                        <AdminBadge variant="warning">Email unverified</AdminBadge>
                      )}
                    </div>

                    <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                      <InfoRow icon={Mail} label="Email" value={profile.student.email} />
                      <InfoRow
                        icon={Phone}
                        label="Phone"
                        value={profile.student.phone ?? "Not provided"}
                      />
                      <InfoRow
                        icon={GraduationCap}
                        label="Class"
                        value={formatClassLabel(profile.student.classLevel)}
                      />
                      <InfoRow
                        icon={ShieldCheck}
                        label="Student ID"
                        value={profile.student.studentId ?? "Not assigned"}
                      />
                      <InfoRow
                        icon={CalendarDays}
                        label="Enrollment date"
                        value={
                          profile.student.enrolledAt
                            ? formatAdminDate(profile.student.enrolledAt)
                            : "Not enrolled yet"
                        }
                      />
                      <InfoRow
                        icon={Clock}
                        label="Account created"
                        value={formatAdminDate(profile.student.createdAt)}
                      />
                    </dl>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {profile.student.counts.enrollmentRequests > 0 ? (
                    <Link href="/admin/students?tab=requests">
                      <AdminButton variant="ghost">
                        {profile.student.counts.enrollmentRequests} open request
                        {profile.student.counts.enrollmentRequests === 1 ? "" : "s"}
                      </AdminButton>
                    </Link>
                  ) : null}
                  <AdminButton variant="secondary" onClick={openAccountModal}>
                    Manage account
                  </AdminButton>
                </div>
              </div>
            </AdminCard>
          </motion.div>

          {/* Progress at a glance */}
          <motion.div variants={fadeUp}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                icon={TrendingUp}
                tone="bg-violet-50 text-violet-600"
                label="Overall progress"
                value={`${profile.overall.progressPercent}%`}
                hint={`${profile.overall.completedLessons} of ${profile.overall.totalLessons} lessons`}
              />
              <StatTile
                icon={BookOpenCheck}
                tone="bg-emerald-50 text-emerald-600"
                label="Courses enrolled"
                value={profile.student.counts.enrollments}
                hint={
                  profile.courses.filter((course) => course.progressPercent >= 100).length >
                  0
                    ? `${profile.courses.filter((c) => c.progressPercent >= 100).length} completed`
                    : "None completed yet"
                }
              />
              <StatTile
                icon={ClipboardList}
                tone="bg-sky-50 text-sky-600"
                label="Quiz attempts"
                value={profile.assessments.quizzes.attemptCount}
                hint={
                  profile.assessments.quizzes.attemptCount > 0
                    ? `${profile.assessments.quizzes.averagePercent}% average · ${profile.assessments.quizzes.passedCount} passed`
                    : "No quizzes taken"
                }
              />
              <StatTile
                icon={ClipboardCheck}
                tone="bg-amber-50 text-amber-600"
                label="Exam attempts"
                value={profile.assessments.exams.attemptCount}
                hint={
                  profile.assessments.exams.attemptCount > 0
                    ? `${profile.assessments.exams.averagePercent}% average`
                    : "No exams taken"
                }
              />
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <AdminCard className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Overall learning progress
                </h2>
                <span className="text-xs text-slate-500">
                  Last active {formatLastActive(profile.overall.lastActiveAt)}
                </span>
              </div>
              <StudentProgressBar
                className="mt-3 min-w-0"
                percent={profile.overall.progressPercent}
                status={profile.overall.status}
              />
            </AdminCard>
          </motion.div>

          {/* Per-course progress */}
          <motion.div variants={fadeUp}>
            <AdminCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Course progress ({profile.courses.length})
              </h2>
              {profile.courses.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                  This student is not enrolled in any course yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {profile.courses.map((course) => (
                    <li
                      key={course.courseId}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-navy">{course.courseTitle}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Enrolled {formatAdminDate(course.enrolledAt)} ·{" "}
                            {course.completedLessons}/{course.totalLessons} lessons ·
                            Last opened {formatLastActive(course.lastAccessedAt)}
                          </p>
                        </div>
                        <StudentProgressBadge status={course.status} />
                      </div>
                      <StudentProgressBar
                        className="mt-3 min-w-0"
                        percent={course.progressPercent}
                        status={course.status}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </motion.div>

          {/* Assessment activity */}
          <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-2">
            <AdminCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Recent quiz attempts
              </h2>
              {profile.assessments.quizzes.recent.length === 0 ? (
                <EmptyRow label="No quiz attempts yet." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {profile.assessments.quizzes.recent.map((attempt) => (
                    <li
                      key={attempt.id}
                      className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy">
                          {attempt.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatAdminDate(attempt.submittedAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-navy">
                          {attempt.score}/{attempt.total}
                        </p>
                        <AdminBadge variant={attempt.passed ? "success" : "danger"}>
                          {attempt.percentage}% {attempt.passed ? "pass" : "fail"}
                        </AdminBadge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Recent exam attempts
              </h2>
              {profile.assessments.exams.recent.length === 0 ? (
                <EmptyRow label="No exam attempts yet." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {profile.assessments.exams.recent.map((attempt) => (
                    <li
                      key={attempt.id}
                      className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy">
                          {attempt.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatAdminDate(attempt.submittedAt)} ·{" "}
                          {formatCompletionTime(attempt.timeTakenSec)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {attempt.correctQty} correct · {attempt.wrongQty} wrong ·{" "}
                          {attempt.skippedQty} skipped
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-navy">
                        {attempt.score}/{attempt.total}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </motion.div>
        </motion.div>
      )}

      <UserAccountModal
        user={accountUser}
        isLoading={accountUpdating}
        loadingAction={accountAction}
        errorMessage={accountError}
        fieldErrors={accountFieldErrors}
        onClose={() => {
          if (accountUpdating) return;
          setAccountUser(null);
          setAccountError(null);
          setAccountFieldErrors({});
        }}
        onSuspend={(message) => void updateAccountStatus("SUSPENDED", message)}
        onApprove={() => void updateAccountStatus("ACTIVE")}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="truncate text-sm text-slate-700">{value}</dd>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: typeof Mail;
  tone: string;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{hint}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            tone,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
      {label}
    </p>
  );
}
