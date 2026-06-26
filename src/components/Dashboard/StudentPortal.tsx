"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Gamepad2,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  LogOut,
  MonitorSmartphone,
  Phone,
  ReceiptText,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { CounsellingTab } from "./CounsellingTab";
import { StudentGameTab } from "./StudentGameTab";
import { NotificationBell } from "@/components/Layout/Navbar/NotificationBell";
import { UserNavMenu } from "@/components/Layout/Navbar/UserNavMenu";

import { BrandLogo } from "@/components/Brand";
import type { NavSession } from "@/lib/nav/types";
import {
  enrollmentRequestStatusLabel,
  isEnrollmentRequestOpen,
} from "@/lib/enrollments/status";
import type {
  StudentPortalData,
  StudentProfile,
} from "@/lib/student/types";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "courses", label: "My Courses", icon: BookOpenCheck },
  { id: "enrollments", label: "Enrollment Requests", icon: ReceiptText },
  { id: "counselling", label: "Counselling", icon: CalendarDays },
  { id: "game", label: "Game", icon: Gamepad2 },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "quizzes", label: "Quiz Results", icon: Trophy },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

type PortalTab = (typeof tabs)[number]["id"];

export default function StudentPortal({
  data,
  initialTab,
}: {
  data: StudentPortalData;
  initialTab?: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const validInitial = tabs.some((tab) => tab.id === initialTab)
    ? (initialTab as PortalTab)
    : "overview";
  const [activeTab, setActiveTab] = useState<PortalTab>(validInitial);
  const [profile, setProfile] = useState(data.profile);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(
    null,
  );
  const hasEnrollment = data.courses.length > 0;
  const portalNavSession: NavSession = {
    fullName: profile.fullName,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    role: "STUDENT",
    hasEnrollment,
    studentId: profile.studentId,
    unreadCount: 0,
  };
  const hasOpenEnrollmentRequest = data.enrollmentRequests.some((request) =>
    isEnrollmentRequestOpen(request.status),
  );

  useEffect(() => {
    if (!hasOpenEnrollmentRequest) return;

    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [hasOpenEnrollmentRequest, router]);

  function showToast(message: string, error = false) {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 3500);
  }

  function selectTab(tab: PortalTab) {
    setActiveTab(tab);
    const url = tab === "overview" ? "/dashboard" : `/dashboard?tab=${tab}`;
    window.history.replaceState(null, "", url);
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f3f7fb] text-navy">
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`fixed right-4 top-4 z-[70] flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-2xl ${
              toast.error ? "bg-red-600" : "bg-navy"
            }`}
          >
            {toast.error ? null : <Check className="h-4 w-4 text-[#8cf0d0]" />}
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-navy/8 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-[96rem] items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <UserNavMenu session={portalNavSession} variant="light" />
            {hasEnrollment ? (
              <NotificationBell variant="light" enabled initialUnreadCount={0} />
            ) : null}
            <Link
              href="/"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-navy/55 transition hover:bg-navy/5 hover:text-navy sm:block"
            >
              Visit website
            </Link>
          </div>
        </div>
      </header>

      {!profile.emailVerifiedAt ? (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-[96rem] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-amber-900">
              Please verify your email to secure your account and receive enrollment updates.
            </p>
            <Link
              href="/verify-email"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-amber-900 px-4 text-xs font-bold text-white"
            >
              Verify email
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[96rem] px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid w-full min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="sticky top-24 hidden overflow-hidden rounded-[1.65rem] border border-navy/8 bg-white p-3 shadow-[0_16px_45px_rgba(22,51,81,.07)] lg:block">
            <StudentIdentity profile={profile} />
            <nav className="mt-3 space-y-1 border-t border-navy/8 pt-3">
              {tabs.map((tab) => (
                <NavButton
                  key={tab.id}
                  tab={tab}
                  active={activeTab === tab.id}
                  onClick={() => selectTab(tab.id)}
                />
              ))}
            </nav>
          </aside>

          <div className="min-w-0 w-full max-w-full overflow-x-clip [contain:inline-size]">
            <div className="mb-5 w-full min-w-0 overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-sm lg:hidden">
              <div className="flex gap-1 overflow-x-auto overscroll-x-contain p-1.5 [-webkit-overflow-scrolling:touch]">
                {tabs.map((tab) => (
                  <NavButton
                    key={tab.id}
                    tab={tab}
                    active={activeTab === tab.id}
                    onClick={() => selectTab(tab.id)}
                    compact
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="w-full min-w-0 max-w-full"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.28 }}
              >
                {activeTab === "overview" ? (
                  <Overview data={data} profile={profile} selectTab={selectTab} />
                ) : activeTab === "courses" ? (
                  <Courses data={data} />
                ) : activeTab === "enrollments" ? (
                  <EnrollmentRequests data={data} />
                ) : activeTab === "counselling" ? (
                  <CounsellingTab profile={profile} notify={showToast} />
                ) : activeTab === "game" ? (
                  <StudentGameTab
                    hasEnrollment={hasEnrollment}
                    firstName={profile.fullName.split(/\s+/)[0] ?? "Student"}
                    onBrowseEnrollments={() => selectTab("enrollments")}
                  />
                ) : activeTab === "progress" ? (
                  <Progress data={data} />
                ) : activeTab === "quizzes" ? (
                  <QuizResults data={data} />
                ) : activeTab === "profile" ? (
                  <ProfileForm
                    profile={profile}
                    hasEnrollment={hasEnrollment}
                    onUpdate={setProfile}
                    notify={showToast}
                  />
                ) : (
                  <Security
                    data={data}
                    notify={showToast}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}

function Overview({
  data,
  profile,
  selectTab,
}: {
  data: StudentPortalData;
  profile: StudentProfile;
  selectTab: (tab: PortalTab) => void;
}) {
  const firstName = profile.fullName.split(/\s+/)[0];
  const nextCourse = data.courses[0];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-navy p-7 text-white shadow-2xl shadow-navy/15 sm:p-10">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.2)_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-btnBg/25 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8cf0d0]">
            <Sparkles className="h-4 w-4" />
            Student portal
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-white/65">
            Everything you need to learn, measure progress, and manage your account
            is now in one calm workspace.
          </p>
          {nextCourse?.continueLessonSlug ? (
            <Link
              href={`/learn/${nextCourse.slug}/${nextCourse.continueLessonSlug}`}
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-navy transition hover:-translate-y-0.5"
            >
              Continue learning <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpenCheck} label="Active courses" value={data.stats.activeCourses} color="blue" />
        <StatCard icon={CheckCircle2} label="Lessons completed" value={data.stats.completedLessons} color="green" />
        <StatCard icon={BarChart3} label="Overall progress" value={`${data.stats.averageProgress}%`} color="navy" />
        <StatCard icon={Trophy} label="Average quiz score" value={`${data.stats.averageQuizScore}%`} color="amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/submit-documents"
          className="flex items-center gap-4 rounded-2xl border border-navy/8 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-btnBg/25"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-btnBg/10 text-btnBg">
            <ReceiptText className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-navy">Submit documents</p>
            <p className="mt-1 text-sm text-navy/50">Upload assignments or school papers for review.</p>
          </div>
        </Link>
        <Link
          href="/notices"
          className="flex items-center gap-4 rounded-2xl border border-navy/8 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-btnBg/25"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <CalendarDays className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-navy">Academy notices</p>
            <p className="mt-1 text-sm text-navy/50">Read official updates from Broad Academy.</p>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Continue your courses"
          eyebrow="My learning"
          action={<button onClick={() => selectTab("courses")} className="text-sm font-bold text-btnBg">View all</button>}
        >
          {data.courses.length ? (
            <div className="space-y-4">
              {data.courses.slice(0, 3).map((course) => (
                <CompactCourse key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState icon={GraduationCap} title="No active courses yet" text="Your courses will appear after enrollment is confirmed." />
          )}
        </Panel>
        <Panel title="Recent quiz activity" eyebrow="Performance">
          {data.quizAttempts.length ? (
            <div className="space-y-3">
              {data.quizAttempts.slice(0, 4).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f9fc] p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{attempt.title}</p>
                    <p className="mt-1 text-xs text-navy/40">{formatDate(attempt.submittedAt)}</p>
                  </div>
                  <strong className={attempt.passed ? "text-accent" : "text-red-600"}>{attempt.percentage}%</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Trophy} title="No quizzes taken" text="Your scores and attempts will appear here." />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Courses({ data }: { data: StudentPortalData }) {
  return (
    <div>
      <PageHeading eyebrow="Learning library" title="My enrolled courses" description="Continue lessons and see progress for every active enrollment." />
      {data.courses.length ? (
        <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.courses.map((course) => (
            <article key={course.id} className="group overflow-hidden rounded-[1.75rem] border border-navy/8 bg-white shadow-[0_16px_45px_rgba(22,51,81,.07)]">
              <div className="relative aspect-[16/8] overflow-hidden">
                <Image src={course.thumbnailUrl} alt="" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/75 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-bold">{course.subject}</span>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold tracking-[-0.025em]">{course.title}</h2>
                <p className="mt-2 text-sm text-navy/45">With {course.instructorName}</p>
                <ProgressBar value={course.progressPercent} label={`${course.completedLessons} of ${course.totalLessons} lessons`} />
                {course.continueLessonSlug ? (
                  <Link href={`/learn/${course.slug}/${course.continueLessonSlug}`} className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-btnBg px-5 text-sm font-bold text-white">
                    {course.progressPercent ? "Continue course" : "Start course"} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-[2rem] border border-dashed border-navy/15 bg-white py-16">
          <EmptyState icon={GraduationCap} title="No active enrollments yet" text="Explore our course catalogue or contact support about your enrollment." />
        </div>
      )}
    </div>
  );
}

function EnrollmentRequests({ data }: { data: StudentPortalData }) {
  return (
    <div>
      <PageHeading
        eyebrow="Enrollment tracking"
        title="Payment verification requests"
        description="Track every bKash submission and see when course access is approved."
      />
      {data.enrollmentRequests.length ? (
        <div className="mt-7 space-y-4">
          {data.enrollmentRequests.map((request) => {
            const active = request.status === "APPROVED";
            const pending = isEnrollmentRequestOpen(request.status);
            return (
              <article
                key={request.id}
                className="grid gap-5 rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-sm sm:grid-cols-[96px_1fr_auto] sm:items-center"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src={request.course.thumbnailUrl}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-navy">{request.course.title}</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                        active
                          ? "bg-emerald-50 text-emerald-700"
                          : request.status === "REVIEWING"
                            ? "bg-blue-50 text-blue-700"
                            : pending
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {enrollmentRequestStatusLabel[request.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-navy/55">
                    ৳{request.paidAmount.toLocaleString()} · Transaction{" "}
                    <span className="font-mono font-semibold text-navy">
                      {request.bkashTransactionId}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-navy/40">
                    Submitted {formatDate(request.submittedAt)}
                  </p>
                  {request.reviewNote ? (
                    <p className="mt-3 rounded-xl bg-[#f7f9fc] px-3 py-2 text-xs leading-5 text-navy/65">
                      Staff note: {request.reviewNote}
                    </p>
                  ) : null}
                </div>
                <div>
                  {active ? (
                    <Link
                      href={`/learn/${request.course.slug}`}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-btnBg px-5 text-sm font-bold text-white"
                    >
                      Start course <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : pending ? (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                      <Clock3 className="h-4 w-4" />
                      Awaiting verification
                    </span>
                  ) : (
                    <Link
                      href={`/courses/${request.course.slug}`}
                      className="text-sm font-bold text-btnBg"
                    >
                      Review and resubmit
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-7 rounded-[2rem] border border-dashed border-navy/15 bg-white py-16">
          <EmptyState
            icon={ReceiptText}
            title="No enrollment requests yet"
            text="Choose a course and submit your bKash payment details to begin verification."
          />
          <div className="-mt-5 text-center">
            <Link href="/courses" className="text-sm font-bold text-btnBg">
              Explore courses
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Progress({ data }: { data: StudentPortalData }) {
  return (
    <div>
      <PageHeading eyebrow="Learning analytics" title="Your progress" description="A straightforward view of completed lessons and course momentum." />
      <div className="mt-7 grid gap-5 sm:grid-cols-3">
        <StatCard icon={CheckCircle2} label="Completed lessons" value={data.stats.completedLessons} color="green" />
        <StatCard icon={Clock3} label="Lessons remaining" value={Math.max(0, data.stats.totalLessons - data.stats.completedLessons)} color="blue" />
        <StatCard icon={BarChart3} label="Overall completion" value={`${data.stats.averageProgress}%`} color="navy" />
      </div>
      <Panel title="Course-by-course progress" eyebrow="Breakdown" className="mt-6">
        {data.courses.length ? (
          <div className="space-y-5">
            {data.courses.map((course) => (
              <div key={course.id} className="rounded-2xl border border-navy/8 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="mt-1 text-xs text-navy/45">{course.subject} · {course.instructorName}</p>
                  </div>
                  <strong className="text-xl text-btnBg">{course.progressPercent}%</strong>
                </div>
                <ProgressBar value={course.progressPercent} label={`${course.completedLessons} completed · ${Math.max(0, course.totalLessons - course.completedLessons)} remaining`} />
              </div>
            ))}
          </div>
        ) : <EmptyState icon={BarChart3} title="No progress to show" text="Progress starts when you begin an enrolled course." />}
      </Panel>
    </div>
  );
}

function QuizResults({ data }: { data: StudentPortalData }) {
  return (
    <div>
      <PageHeading eyebrow="Assessment history" title="Quiz results" description="Review your latest attempts and watch your scores improve." />
      <div className="mt-7 grid gap-5 sm:grid-cols-3">
        <StatCard icon={Trophy} label="Quizzes taken" value={data.stats.quizzesTaken} color="amber" />
        <StatCard icon={BarChart3} label="Average score" value={`${data.stats.averageQuizScore}%`} color="blue" />
        <StatCard icon={CheckCircle2} label="Passed attempts" value={data.quizAttempts.filter((item) => item.passed).length} color="green" />
      </div>
      <Panel title="Attempt history" eyebrow="Recent results" className="mt-6">
        {data.quizAttempts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-navy/8 text-xs uppercase tracking-[0.12em] text-navy/40">
                <tr><th className="pb-4">Quiz</th><th className="pb-4">Course</th><th className="pb-4">Score</th><th className="pb-4">Result</th><th className="pb-4 text-right">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-navy/7">
                {data.quizAttempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="py-4 font-semibold">{attempt.title}</td>
                    <td className="py-4 text-navy/55">{attempt.courseTitle}</td>
                    <td className="py-4">{attempt.score}/{attempt.total} <strong className="ml-2 text-btnBg">{attempt.percentage}%</strong></td>
                    <td className="py-4"><StatusBadge passed={attempt.passed} /></td>
                    <td className="py-4 text-right text-navy/45">{formatDate(attempt.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState icon={Trophy} title="No quiz attempts yet" text="Complete a lesson quiz and its result will be saved here." />}
      </Panel>
    </div>
  );
}

function ProfileForm({
  profile,
  hasEnrollment,
  onUpdate,
  notify,
}: {
  profile: StudentProfile;
  hasEnrollment: boolean;
  onUpdate: (profile: StudentProfile) => void;
  notify: (message: string, error?: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const [avatarPending, setAvatarPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: form.get("fullName"), phone: form.get("phone") }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message ?? "Could not update your profile.");
        return;
      }
      onUpdate({
        ...profile,
        fullName: result.data.fullName,
        phone: result.data.phone,
      });
      notify("Profile updated successfully.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!hasEnrollment) {
      notify("Profile photo is available after your first enrollment is approved.", true);
      return;
    }

    setAvatarPending(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.message ?? "Could not update profile photo.", true);
        return;
      }
      onUpdate({ ...profile, avatarUrl: result.data.avatarUrl });
      notify("Profile photo updated.");
    } catch {
      notify("Could not upload profile photo.", true);
    } finally {
      setAvatarPending(false);
    }
  }

  return (
    <div>
      <PageHeading eyebrow="Account settings" title="Personal profile" description="Keep your student information accurate and up to date." />
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Personal information" eyebrow="Editable details">
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-navy/8 bg-[#f7f9fc] p-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-btnBg to-accent shadow-md">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                  {initials(profile.fullName)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy">Profile photo</p>
              <p className="mt-1 text-xs leading-5 text-navy/50">
                {hasEnrollment
                  ? "Upload a clear photo. It appears in the navbar and your dashboard."
                  : "Available after your first course enrollment is approved."}
              </p>
              {hasEnrollment ? (
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-semibold text-navy transition hover:bg-navy/5">
                  {avatarPending ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserRound className="h-3.5 w-3.5" />
                  )}
                  {avatarPending ? "Uploading..." : "Change photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={avatarPending}
                    onChange={handleAvatarChange}
                  />
                </label>
              ) : null}
            </div>
          </div>
          <form onSubmit={submit} className="space-y-5">
            <Field label="Full name" icon={UserRound}>
              <input name="fullName" defaultValue={profile.fullName} required maxLength={80} autoComplete="name" className={inputClass} />
            </Field>
            <Field label="Email address" icon={Mail}>
              <input value={profile.email} disabled className={inputClass} />
            </Field>
            <Field label="Phone number" icon={Phone}>
              <input name="phone" defaultValue={profile.phone ?? ""} maxLength={20} autoComplete="tel" className={inputClass} />
            </Field>
            {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <button disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-btnBg px-6 text-sm font-bold text-white disabled:opacity-60">
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
            </button>
          </form>
        </Panel>
        <Panel title="Account details" eyebrow="Student record">
          <dl className="space-y-4">
            {profile.studentId ? (
              <Info label="Student ID" value={profile.studentId} icon={GraduationCap} />
            ) : (
              <div className="rounded-xl border border-dashed border-navy/12 bg-[#f7f9fc] px-4 py-3 text-sm text-navy/55">
                Your student ID is issued after your first enrollment is approved.
              </div>
            )}
            {profile.classLevel ? (
              <Info label="Class" value={`Class ${profile.classLevel}`} icon={BookOpenCheck} />
            ) : null}
            <Info label="Account role" value="Student" icon={GraduationCap} />
            <Info label="Account status" value={profile.status === "ACTIVE" ? "Active" : "Suspended"} icon={ShieldCheck} />
            <Info label="Member since" value={formatDate(profile.createdAt)} icon={CalendarDays} />
            <Info label="Last login" value={profile.lastLoginAt ? formatDate(profile.lastLoginAt) : "Not recorded"} icon={Clock3} />
          </dl>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Your email is your login identity and cannot be changed here. Contact support if it needs correction.
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Security({
  data,
  notify,
}: {
  data: StudentPortalData;
  notify: (message: string, error?: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState<Record<string, boolean>>({});

  async function revokeSession(sessionId: string) {
    setRevokingId(sessionId);
    try {
      const response = await fetch("/api/profile/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.message ?? "Could not sign out that device.", true);
        return;
      }
      notify(result.message);
      router.refresh();
    } catch {
      notify("Could not reach the server.", true);
    } finally {
      setRevokingId(null);
    }
  }

  async function revokeOtherSessions() {
    setRevokingOthers(true);
    try {
      const response = await fetch("/api/profile/sessions", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        notify(result.message ?? "Could not sign out other devices.", true);
        return;
      }
      notify(result.message);
      router.refresh();
    } catch {
      notify("Could not reach the server.", true);
    } finally {
      setRevokingOthers(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword: form.get("newPassword"),
          confirmNewPassword: form.get("confirmNewPassword"),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message ?? "Could not change password.");
        return;
      }
      event.currentTarget.reset();
      notify(result.message);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Account protection"
        title="Security and sessions"
        description="Change your password, review signed-in devices, and manage playback limits."
      />
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Change password" eyebrow="Credentials">
          <form onSubmit={submit} className="space-y-5">
            {[
              ["currentPassword", "Current password"],
              ["newPassword", "New password"],
              ["confirmNewPassword", "Confirm new password"],
            ].map(([name, label]) => (
              <Field key={name} label={label} icon={LockKeyhole}>
                <div className="relative">
                  <input name={name} type={show[name] ? "text" : "password"} required maxLength={72} autoComplete={name === "currentPassword" ? "current-password" : "new-password"} className={`${inputClass} pr-11`} />
                  <button type="button" onClick={() => setShow((value) => ({ ...value, [name]: !value[name] }))} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-navy/35" aria-label={show[name] ? "Hide password" : "Show password"}>
                    {show[name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            ))}
            {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <button disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-6 text-sm font-bold text-white disabled:opacity-60">
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Update password
            </button>
          </form>
        </Panel>
        <Panel title="Active sessions" eyebrow="Signed-in devices">
          <div className="space-y-3">
            {data.sessions.map((session) => (
              <div key={session.id} className="flex gap-3 rounded-2xl border border-navy/8 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-heroBg text-accent"><MonitorSmartphone className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{session.device}</p>
                    {session.isCurrent ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">This device</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-navy/40">Last active {formatDate(session.lastUsedAt)} · Expires {formatDate(session.expiresAt)}</p>
                </div>
                {!session.isCurrent ? (
                  <button
                    type="button"
                    disabled={revokingId === session.id}
                    onClick={() => void revokeSession(session.id)}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 self-center rounded-xl border border-navy/10 px-3 text-xs font-semibold text-navy/70 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                  >
                    {revokingId === session.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                    Sign out
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {data.sessions.some((session) => !session.isCurrent) ? (
            <button
              type="button"
              disabled={revokingOthers}
              onClick={() => void revokeOtherSessions()}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-navy/10 px-4 text-xs font-bold text-navy/70 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              {revokingOthers ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              Sign out all other devices
            </button>
          ) : null}
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-[#f7f9fc] p-4 text-xs leading-6 text-navy/55">
              Your account can stay signed in on up to {data.devicePolicy.maxSessions} devices at once. Signing in on a third device signs out the oldest session automatically.
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
              Only one device can play lesson videos at a time. If playback is blocked, sign out the other device here or wait about a minute after it stops.
            </div>
            <div className="rounded-2xl bg-[#f7f9fc] p-4 text-xs leading-6 text-navy/55">
              Changing your password signs out every other device while keeping this session active.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StudentIdentity({ profile }: { profile: StudentProfile }) {
  return (
    <div className="rounded-2xl bg-navy p-4 text-white">
      <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-gradient-to-br from-[#8cf0d0] to-accent shadow-sm">
        {profile.avatarUrl ? (
          <Image src={profile.avatarUrl} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-bold text-navy">
            {initials(profile.fullName)}
          </span>
        )}
      </div>
      <p className="mt-3 truncate font-semibold">{profile.fullName}</p>
      <p className="mt-1 truncate text-xs text-white/45">{profile.email}</p>
      {profile.studentId ? (
        <p className="mt-2 text-[11px] font-bold tracking-wide text-[#8cf0d0]">
          ID {profile.studentId}
        </p>
      ) : null}
      <span className="mt-3 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8cf0d0]">
        Student account
      </span>
    </div>
  );
}

function NavButton({
  tab,
  active,
  onClick,
  compact = false,
}: {
  tab: (typeof tabs)[number];
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = tab.icon;
  return (
    <button type="button" onClick={onClick} className={`relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${compact ? "shrink-0 whitespace-nowrap" : "w-full"} ${active ? "bg-btnBg/8 text-btnBg" : "text-navy/55 hover:bg-navy/4 hover:text-navy"}`}>
      {active ? <motion.span layoutId={compact ? "mobile-portal-tab" : "portal-tab"} className="absolute inset-0 rounded-xl bg-btnBg/8" /> : null}
      <Icon className="relative h-4.5 w-4.5" />
      <span className="relative">{tab.label}</span>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Trophy; label: string; value: string | number; color: "blue" | "green" | "navy" | "amber" }) {
  const colors = { blue: "bg-btnBg/8 text-btnBg", green: "bg-accent/8 text-accent", navy: "bg-navy/8 text-navy", amber: "bg-amber-50 text-amber-600" };
  return <article className="rounded-3xl border border-navy/8 bg-white p-5 shadow-sm"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}><Icon className="h-5 w-5" /></span><p className="mt-5 text-3xl font-bold tracking-[-0.04em]">{value}</p><p className="mt-1 text-sm text-navy/45">{label}</p></article>;
}

function Panel({ title, eyebrow, children, action, className = "" }: { title: string; eyebrow: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-[0_14px_40px_rgba(22,51,81,.05)] sm:p-7 ${className}`}><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">{title}</h2></div>{action}</div>{children}</section>;
}

function CompactCourse({ course }: { course: StudentPortalData["courses"][number] }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-navy/8 p-3"><div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl"><Image src={course.thumbnailUrl} alt="" fill sizes="80px" className="object-cover" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{course.title}</p><ProgressBar value={course.progressPercent} label={`${course.completedLessons}/${course.totalLessons} lessons`} compact /></div>{course.continueLessonSlug ? <Link href={`/learn/${course.slug}/${course.continueLessonSlug}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-white"><ArrowRight className="h-4 w-4" /></Link> : null}</div>;
}

function ProgressBar({ value, label, compact = false }: { value: number; label: string; compact?: boolean }) {
  return <div className={compact ? "mt-2" : "mt-5"}><div className="flex items-center justify-between text-xs font-semibold text-navy/45"><span>{label}</span><span className="text-btnBg">{value}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-navy/8"><motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} className="h-full rounded-full bg-gradient-to-r from-accent to-btnBg" /></div></div>;
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl leading-7 text-navy/50">{description}</p></div>;
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof Trophy; title: string; text: string }) {
  return <div className="px-4 py-9 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-heroBg text-accent"><Icon className="h-7 w-7" /></span><h3 className="mt-4 font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-navy/45">{text}</p></div>;
}

function StatusBadge({ passed }: { passed: boolean }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${passed ? "bg-accent/10 text-accent" : "bg-red-50 text-red-600"}`}>{passed ? "Passed" : "Try again"}</span>;
}

const inputClass = "h-12 w-full rounded-xl border border-navy/10 bg-[#f8fafc] px-4 text-sm text-navy outline-none transition focus:border-btnBg focus:ring-4 focus:ring-btnBg/10 disabled:cursor-not-allowed disabled:text-navy/40";

function Field({ label, icon: Icon, children }: { label: string; icon: typeof UserRound; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-navy/35" />{label}</span>{children}</label>;
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UserRound }) {
  return <div className="flex items-center justify-between gap-4 border-b border-navy/7 pb-4 last:border-0"><dt className="flex items-center gap-3 text-sm text-navy/50"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-heroBg text-accent"><Icon className="h-4 w-4" /></span>{label}</dt><dd className="text-right text-sm font-semibold">{value}</dd></div>;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}
