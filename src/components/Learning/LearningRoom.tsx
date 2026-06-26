"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  CirclePlay,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  LoaderCircle,
  Menu,
  Search,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BrandLogo } from "@/components/Brand";
import { ProtectedYouTubePlayer } from "@/components/Learning/ProtectedYouTubePlayer";
import type {
  CurrentLearningLesson,
  LearningLesson,
  LearningRoomData,
  PublicQuiz,
} from "@/lib/learning/types";

type Tab = "overview" | "resources" | "quiz";

export default function LearningRoom({
  data,
  studentName,
  studentEmail,
}: {
  data: LearningRoomData;
  studentName: string;
  studentEmail: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>(
    data.currentLesson.type === "QUIZ" ? "quiz" : "overview",
  );
  const [saving, setSaving] = useState(false);
  const [locallyCompleted, setLocallyCompleted] = useState(
    data.currentLesson.completed,
  );
  const handleVideoCompleted = useCallback(() => {
    setLocallyCompleted(true);
    router.refresh();
  }, [router]);

  async function toggleComplete() {
    setSaving(true);
    const completed = !locallyCompleted;
    try {
      const response = await fetch("/api/learning/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: data.currentLesson.id,
          completed,
          watchedSeconds: completed ? data.currentLesson.durationSeconds : 0,
          lastPositionSec: completed ? data.currentLesson.durationSeconds : 0,
        }),
      });
      if (!response.ok) return;
      setLocallyCompleted(completed);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-navy">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy text-white shadow-lg shadow-navy/10">
        <div className="mx-auto flex h-16 max-w-[106rem] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo inverse />
            <span className="hidden h-7 w-px bg-white/15 md:block" />
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-semibold">{data.course.title}</p>
              <p className="mt-0.5 text-xs text-white/45">
                {data.course.subject} · {data.course.instructorName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Dashboard
            </Link>
            <span className="hidden rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs text-white/70 lg:block">
              {studentName}
            </span>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-white/15 p-2.5 text-white lg:hidden"
              aria-label="Open course content"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mx-auto grid items-start gap-6 px-4 py-5 transition-[max-width] duration-300 sm:px-6 xl:gap-8 ${
          theaterMode
            ? "max-w-[118rem] lg:grid-cols-1"
            : "max-w-[106rem] lg:grid-cols-[minmax(0,1fr)_390px]"
        }`}
      >
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`min-w-0 ${
            theaterMode
              ? "mx-auto w-full max-w-[min(100%,calc(177.78vh-21.33rem))]"
              : ""
          }`}
        >
          <VideoArea
            lesson={data.currentLesson}
            courseSlug={data.course.slug}
            studentName={studentName}
            studentEmail={studentEmail}
            onCompleted={handleVideoCompleted}
            theaterMode={theaterMode}
            onToggleTheater={() => setTheaterMode((current) => !current)}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/8 bg-white p-3 shadow-sm">
            <LessonNav
              direction="previous"
              courseSlug={data.course.slug}
              lesson={data.previousLesson}
            />
            {data.currentLesson.type === "VIDEO" ? (
              <span
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold ${
                  locallyCompleted
                    ? "bg-accent/10 text-accent"
                    : "bg-navy/5 text-navy/55"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {locallyCompleted ? "Lesson completed" : "Completes at 90% watched"}
              </span>
            ) : (
              <button
                type="button"
                onClick={toggleComplete}
                disabled={saving}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                  locallyCompleted
                    ? "bg-accent/10 text-accent"
                    : "border border-navy/10 bg-white text-navy hover:border-accent/35"
                }`}
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {locallyCompleted ? "Lesson completed" : "Mark as complete"}
              </button>
            )}
            <LessonNav
              direction="next"
              courseSlug={data.course.slug}
              lesson={data.nextLesson}
            />
          </div>

          {data.quiz && data.currentLesson.type !== "QUIZ" ? (
            <button
              type="button"
              onClick={() => setActiveTab("quiz")}
              className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/10 to-btnBg/5 p-4 text-left transition hover:border-accent/40 sm:p-5"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
                  <Trophy className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block text-sm sm:text-base">Quick lesson quiz</strong>
                  <span className="mt-0.5 block text-xs text-navy/50 sm:text-sm">
                    Check your understanding before moving to the next lesson.
                  </span>
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-accent" />
            </button>
          ) : null}

          <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-navy/8 bg-white shadow-[0_18px_50px_rgba(22,51,81,.06)]">
            <div className="flex overflow-x-auto border-b border-navy/8 px-3 pt-2 sm:px-6">
              <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
                <FileText className="h-4 w-4" /> Lesson overview
              </TabButton>
              <TabButton active={activeTab === "resources"} onClick={() => setActiveTab("resources")}>
                <BookOpenCheck className="h-4 w-4" /> Resources
              </TabButton>
              {data.quiz ? (
                <TabButton active={activeTab === "quiz"} onClick={() => setActiveTab("quiz")}>
                  <Trophy className="h-4 w-4" /> Lesson quiz
                </TabButton>
              ) : null}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-5 sm:p-8"
              >
                {activeTab === "overview" ? (
                  <LessonOverview lesson={data.currentLesson} />
                ) : activeTab === "resources" ? (
                  <LessonResources lesson={data.currentLesson} />
                ) : data.quiz ? (
                  <QuizPanel quiz={data.quiz} />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </section>

          {theaterMode ? (
            <motion.section
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 overflow-hidden rounded-[1.75rem] border border-navy/8 bg-white shadow-[0_18px_55px_rgba(22,51,81,.08)]"
            >
              <Curriculum
                data={data}
                search={search}
                setSearch={setSearch}
                inline
              />
            </motion.section>
          ) : null}
        </motion.section>

        <aside
          className={`sticky top-21 max-h-[calc(100vh-6.5rem)] overflow-hidden rounded-[1.75rem] border border-navy/8 bg-white shadow-[0_18px_55px_rgba(22,51,81,.09)] ${
            theaterMode ? "hidden" : "hidden lg:block"
          }`}
        >
          <Curriculum
            data={data}
            search={search}
            setSearch={setSearch}
          />
        </aside>
      </div>

      <AnimatePresence>
        {sidebarOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close course content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-navy/45 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-[min(92vw,410px)] overflow-hidden bg-white shadow-2xl lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-navy/8 px-5">
                <strong>Course content</strong>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-xl bg-navy/5 p-2"
                  aria-label="Close course content"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Curriculum
                data={data}
                search={search}
                setSearch={setSearch}
                mobile
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function VideoArea({
  lesson,
  courseSlug,
  studentName,
  studentEmail,
  onCompleted,
  theaterMode,
  onToggleTheater,
}: {
  lesson: CurrentLearningLesson;
  courseSlug: string;
  studentName: string;
  studentEmail: string;
  onCompleted: () => void;
  theaterMode: boolean;
  onToggleTheater: () => void;
}) {
  if (lesson.type === "VIDEO") {
    return (
      <ProtectedYouTubePlayer
        lesson={lesson}
        courseSlug={courseSlug}
        lessonSlug={lesson.slug}
        studentName={studentName}
        studentEmail={studentEmail}
        onCompleted={onCompleted}
        theaterMode={theaterMode}
        onToggleTheater={onToggleTheater}
      />
    );
  }

  return (
    <div className="flex aspect-video flex-col items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-navy to-[#244e74] px-6 text-center text-white shadow-2xl shadow-navy/15">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
        {lesson.type === "QUIZ" ? (
          <Trophy className="h-8 w-8 text-[#8cf0d0]" />
        ) : (
          <FileText className="h-8 w-8 text-[#8cf0d0]" />
        )}
      </span>
      <h1 className="mt-5 max-w-xl text-2xl font-semibold sm:text-3xl">{lesson.title}</h1>
      <p className="mt-3 max-w-lg text-sm leading-7 text-white/60">
        {lesson.type === "QUIZ"
          ? "Complete the lesson quiz below to check your understanding."
          : "Read the lesson notes and complete the activity below."}
      </p>
    </div>
  );
}

function Curriculum({
  data,
  search,
  setSearch,
  mobile = false,
  inline = false,
}: {
  data: LearningRoomData;
  search: string;
  setSearch: (value: string) => void;
  mobile?: boolean;
  inline?: boolean;
}) {
  const normalized = search.trim().toLowerCase();
  const modules = normalized
    ? data.modules
        .map((module) => ({
          ...module,
          lessons: module.lessons.filter((lesson) =>
            lesson.title.toLowerCase().includes(normalized),
          ),
        }))
        .filter((module) => module.lessons.length)
    : data.modules;

  return (
    <div
      className={`flex flex-col ${
        mobile
          ? "h-[calc(100vh-4rem)]"
          : inline
            ? "max-h-[38rem]"
            : "max-h-[calc(100vh-6.5rem)]"
      }`}
    >
      <div className="border-b border-navy/8 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Your progress
            </p>
            <p className="mt-1 text-sm font-semibold">
              {data.progress.completed} of {data.progress.total} lessons completed
            </p>
          </div>
          <span className="text-xl font-bold text-btnBg">{data.progress.percent}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy/8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.progress.percent}%` }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-btnBg"
          />
        </div>
        <label className="relative mt-5 block">
          <span className="sr-only">Search lessons</span>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value.slice(0, 80))}
            placeholder="Search lessons"
            className="h-11 w-full rounded-xl border border-navy/10 bg-[#f6f8fb] pl-10 pr-3 text-sm outline-none transition focus:border-btnBg focus:ring-4 focus:ring-btnBg/10"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {modules.length ? (
          modules.map((module, index) => (
            <details key={module.id} open={!normalized && index === findCurrentModule(data)}>
              <summary className="group flex cursor-pointer list-none items-start justify-between gap-3 rounded-xl px-3 py-4 transition hover:bg-navy/4">
                <span className="min-w-0">
                  <span className="block text-xs font-bold uppercase tracking-[0.12em] text-btnBg">
                    Module {index + 1}
                  </span>
                  <strong className="mt-1 block text-sm leading-5">{module.title}</strong>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-navy/40">
                    <Clock3 className="h-3 w-3" />
                    {formatDuration(module.lessons.reduce((sum, lesson) => sum + lesson.durationSeconds, 0))}
                    <span>·</span>
                    {module.lessons.length} lessons
                  </span>
                </span>
                <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-navy/35 transition group-open:rotate-180" />
              </summary>
              <div className="mb-2 space-y-1">
                {module.lessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    courseSlug={data.course.slug}
                    active={lesson.id === data.currentLesson.id}
                  />
                ))}
              </div>
            </details>
          ))
        ) : (
          <div className="px-4 py-12 text-center text-sm text-navy/45">
            No lessons match “{search}”.
          </div>
        )}
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  courseSlug,
  active,
}: {
  lesson: LearningLesson;
  courseSlug: string;
  active: boolean;
}) {
  return (
    <Link
      href={`/learn/${courseSlug}/${lesson.slug}`}
      className={`flex items-start gap-3 rounded-xl px-3 py-3 transition ${
        active ? "bg-btnBg text-white shadow-lg shadow-btnBg/15" : "hover:bg-heroBg"
      }`}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-white/15" : lesson.completed ? "bg-accent/10 text-accent" : "bg-navy/5 text-btnBg"
        }`}
      >
        {lesson.completed ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : lesson.type === "QUIZ" ? (
          <Trophy className="h-4 w-4" />
        ) : lesson.type === "READING" ? (
          <FileText className="h-4 w-4" />
        ) : (
          <CirclePlay className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-5">{lesson.title}</span>
        <span className={`mt-1 block text-xs ${active ? "text-white/60" : "text-navy/40"}`}>
          {formatDuration(lesson.durationSeconds)}
        </span>
      </span>
    </Link>
  );
}

function LessonOverview({ lesson }: { lesson: LearningLesson }) {
  return (
    <article>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-heroBg text-accent">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Current lesson
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            {lesson.title}
          </h1>
        </div>
      </div>
      <p className="mt-6 text-base leading-8 text-navy/65">{lesson.description}</p>
      {lesson.content ? (
        <div className="mt-7 whitespace-pre-line rounded-2xl border border-navy/8 bg-[#f8fafc] p-5 text-sm leading-7 text-navy/68 sm:p-6">
          {lesson.content}
        </div>
      ) : null}
    </article>
  );
}

function LessonResources({ lesson }: { lesson: LearningLesson }) {
  if (!lesson.resources.length) {
    return (
      <div className="py-10 text-center">
        <FileText className="mx-auto h-8 w-8 text-navy/25" />
        <h2 className="mt-4 text-lg font-semibold">No extra resources for this lesson</h2>
        <p className="mt-2 text-sm text-navy/45">Everything you need is included in the video and notes.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Lesson resources</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {lesson.resources.map((resource) => (
          <a
            key={resource.id}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-2xl border border-navy/8 p-4 transition hover:border-btnBg/30 hover:bg-btnBg/3"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-heroBg text-accent">
                <FileText className="h-4 w-4" />
              </span>
              {resource.title}
            </span>
            <ExternalLink className="h-4 w-4 text-navy/35" />
          </a>
        ))}
      </div>
    </div>
  );
}

function QuizPanel({ quiz }: { quiz: PublicQuiz }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startedAt] = useState(() => new Date().toISOString());
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    quiz.timeLimitSeconds ?? null,
  );
  const autoSubmitted = useRef(false);

  const submitQuiz = useCallback(async () => {
    if (pending || result) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/learning/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          answers,
          ...(quiz.timeLimitSeconds ? { startedAt } : {}),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message ?? "Could not submit the quiz.");
        return;
      }
      setResult(payload.data);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }, [answers, pending, quiz.id, quiz.timeLimitSeconds, result, router, startedAt]);

  useEffect(() => {
    if (!quiz.timeLimitSeconds || result) return;
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const remaining = Math.max(0, quiz.timeLimitSeconds! - elapsed);
      setSecondsLeft(remaining);
      if (remaining <= 0 && !autoSubmitted.current) {
        autoSubmitted.current = true;
        void submitQuiz();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [quiz.timeLimitSeconds, result, startedAt, submitQuiz]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await submitQuiz();
  }

  if (result) return <QuizResultView result={result} quiz={quiz} />;

  const timed = Boolean(quiz.timeLimitSeconds);
  const urgent = timed && secondsLeft !== null && secondsLeft <= 60;

  return (
    <form onSubmit={submit}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {timed ? "Timed exam" : "Knowledge check"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{quiz.title}</h2>
          {quiz.description ? <p className="mt-2 text-sm text-navy/55">{quiz.description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {timed && secondsLeft !== null ? (
            <span
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                urgent ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
              }`}
            >
              {formatClock(secondsLeft)} left
            </span>
          ) : null}
          <span className="rounded-full bg-heroBg px-4 py-2 text-xs font-bold text-navy/60">
            Pass mark {quiz.passPercent}%
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-7">
        {quiz.questions.map((question, questionIndex) => (
          <fieldset key={question.id} className="border-b border-navy/8 pb-7 last:border-0">
            <legend className="font-semibold leading-7">
              <span className="mr-2 text-btnBg">{String(questionIndex + 1).padStart(2, "0")}.</span>
              {question.prompt}
            </legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => {
                const checked = answers[question.id]?.includes(option.id) ?? false;
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition ${
                      checked ? "border-btnBg bg-btnBg/5 text-navy" : "border-navy/8 hover:border-navy/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setAnswers((current) => {
                          const selected = current[question.id] ?? [];
                          return {
                            ...current,
                            [question.id]: checked
                              ? selected.filter((id) => id !== option.id)
                              : [...selected, option.id],
                          };
                        })
                      }
                      className="h-4 w-4 accent-[#007bff]"
                    />
                    {option.text}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-btnBg px-6 text-sm font-bold text-white shadow-lg shadow-btnBg/20 disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
        Submit quiz
      </button>
    </form>
  );
}

type QuizResult = {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  review: Array<{
    questionId: string;
    correctOptionIds: string[];
    selectedOptionIds: string[];
    correct: boolean;
    explanation: string | null;
  }>;
};

function QuizResultView({ result, quiz }: { result: QuizResult; quiz: PublicQuiz }) {
  const reviewMap = useMemo(
    () => new Map(result.review.map((item) => [item.questionId, item])),
    [result.review],
  );

  return (
    <div>
      <div className={`rounded-2xl p-6 text-white ${result.passed ? "bg-accent" : "bg-navy"}`}>
        <p className="text-sm font-semibold text-white/70">{result.passed ? "Quiz passed" : "Keep practicing"}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold">{result.score}/{result.total} correct</h2>
          <span className="text-3xl font-bold">{result.percentage}%</span>
        </div>
      </div>
      <div className="mt-7 space-y-5">
        {quiz.questions.map((question, index) => {
          const review = reviewMap.get(question.id);
          return (
            <article key={question.id} className="rounded-2xl border border-navy/8 p-5">
              <h3 className="font-semibold">
                {index + 1}. {question.prompt}
              </h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => {
                  const correct = review?.correctOptionIds.includes(option.id);
                  const selected = review?.selectedOptionIds.includes(option.id);
                  return (
                    <div
                      key={option.id}
                      className={`rounded-xl border p-3 text-sm ${
                        correct
                          ? "border-accent/30 bg-accent/8 text-accent"
                          : selected
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-navy/8 text-navy/55"
                      }`}
                    >
                      {correct ? "✓ " : selected ? "✕ " : ""}{option.text}
                    </div>
                  );
                })}
              </div>
              {review?.explanation ? (
                <p className="mt-4 rounded-xl bg-[#f7f9fc] p-4 text-sm leading-6 text-navy/60">
                  {review.explanation}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function LessonNav({
  direction,
  courseSlug,
  lesson,
}: {
  direction: "previous" | "next";
  courseSlug: string;
  lesson: { slug: string; title: string } | null;
}) {
  const next = direction === "next";
  const className = `inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
    next ? "bg-navy text-white hover:bg-btnBg" : "border border-navy/10 bg-white text-navy hover:border-btnBg"
  }`;
  if (!lesson) return <span className={`${className} cursor-not-allowed opacity-35`}>{next ? "Next" : "Previous"}</span>;
  return (
    <Link href={`/learn/${courseSlug}/${lesson.slug}`} className={className} title={lesson.title}>
      {!next ? <ArrowLeft className="h-4 w-4" /> : null}
      <span className="hidden sm:inline">{next ? "Next lesson" : "Previous lesson"}</span>
      <span className="sm:hidden">{next ? "Next" : "Back"}</span>
      {next ? <ArrowRight className="h-4 w-4" /> : null}
    </Link>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-bold transition ${
        active ? "border-btnBg text-btnBg" : "border-transparent text-navy/45 hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function findCurrentModule(data: LearningRoomData) {
  return Math.max(
    0,
    data.modules.findIndex((module) =>
      module.lessons.some((lesson) => lesson.id === data.currentLesson.id),
    ),
  );
}

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatDuration(seconds: number) {
  if (!seconds) return "Activity";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
}
