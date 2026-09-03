"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  Search,
  SkipForward,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  AdminAvatar,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminInput,
  AdminLoading,
} from "@/components/Admin";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";
import {
  formatClassLabel,
  formatCompletionTime,
  marksTone,
} from "@/lib/exams/monitoring";
import { cn } from "@/lib/utils";

type QuestionSummary = {
  totalQuestions: number;
  correct: number;
  wrong: number;
  unanswered: number;
};

type Overview = {
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
  trend: { attemptId: string; label: string; percent: number }[];
  history: {
    attemptId: string;
    examTitle: string;
    subject: string;
    submittedAt: string;
    score: number;
    total: number;
  }[];
  focusAttempt: {
    attemptId: string;
    examTitle: string;
    subject: string;
    submittedAt: string;
    score: number;
    total: number;
    timeTakenSec: number;
    questionSummary: QuestionSummary;
  } | null;
};

type StudentSuggestion = {
  attemptId: string;
  studentUserId: string;
  studentName: string;
  studentCode: string | null;
  avatarUrl: string | null;
};

const marksToneClass = {
  good: "text-emerald-600",
  average: "text-amber-600",
  poor: "text-red-600",
} as const;

export default function AdminStudentExamOverviewPage({
  attemptId,
}: {
  attemptId: string;
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<StudentSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await adminFetch<Overview>(
        `/api/admin/exams/monitoring/${attemptId}`,
      );
      if (cancelled) return;
      if (result.success && result.data) {
        setOverview(result.data);
        setNotFound(false);
      } else {
        setOverview(null);
        setNotFound(true);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    const params = new URLSearchParams({ search: query.trim(), limit: "20" });
    const result = await adminFetch<{ results: StudentSuggestion[] }>(
      `/api/admin/exams/monitoring?${params}`,
    );
    if (result.success && result.data) {
      // The list endpoint returns one row per attempt; collapse to the most
      // recent attempt per student so the picker lists people, not results.
      const seen = new Set<string>();
      setSuggestions(
        result.data.results.filter((row) => {
          if (seen.has(row.studentUserId)) return false;
          seen.add(row.studentUserId);
          return true;
        }),
      );
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, runSearch]);

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-slate-400">
          <li>
            <Link href="/admin" className="font-medium text-accent hover:underline">
              Dashboard
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/admin/exams" className="font-medium text-accent hover:underline">
              Exam Monitoring
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-slate-500" aria-current="page">
            Student Exam Overview
          </li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
          Student Exam Overview
        </h1>
        <Link href="/admin/exams">
          <AdminButton variant="ghost">
            <ArrowLeft size={15} /> Back to monitoring
          </AdminButton>
        </Link>
      </div>

      {/* Student search */}
      <AdminCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <AdminInput
              placeholder="Search student by name, ID or email..."
              aria-label="Search student by name, ID or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <AdminButton
            className="sm:shrink-0"
            isLoading={searching}
            onClick={() => void runSearch(search)}
          >
            Search
          </AdminButton>
        </div>

        {search.trim().length >= 2 ? (
          <div className="mt-3 border-t border-slate-100 pt-3">
            {suggestions.length === 0 ? (
              <p className="text-sm text-slate-500">
                {searching ? "Searching..." : "No students with exam results matched."}
              </p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {suggestions.map((item) => (
                  <li key={item.studentUserId}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setSuggestions([]);
                        router.push(`/admin/exams/monitoring/${item.attemptId}`);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-slate-50"
                    >
                      <AdminAvatar
                        name={item.studentName}
                        src={item.avatarUrl}
                        size="sm"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-navy">
                          {item.studentName}
                        </span>
                        <span className="block text-xs text-slate-400">
                          ID: {item.studentCode ?? "—"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </AdminCard>

      {loading ? (
        <AdminLoading />
      ) : notFound || !overview ? (
        <AdminEmpty
          title="Exam result not found"
          description="This result may have been deleted. Pick a student above or go back to exam monitoring."
        />
      ) : (
        <motion.div
          className="space-y-6"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="show"
        >
          {/* Student overview */}
          <motion.div variants={fadeUp}>
            <AdminCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Student Overview
              </h2>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:divide-x lg:divide-slate-100">
                <div className="flex items-center gap-4">
                  <AdminAvatar
                    name={overview.student.fullName}
                    src={overview.student.avatarUrl}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold text-navy">
                      {overview.student.fullName}
                    </div>
                    <div className="text-xs text-slate-400">
                      ID: {overview.student.studentCode ?? "—"}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {overview.student.email}
                    </div>
                  </div>
                </div>
                <DetailCell
                  label="Class"
                  value={formatClassLabel(overview.student.classLevel)}
                />
                <DetailCell
                  label="Course"
                  value={overview.student.courseTitle ?? "No course"}
                  hint={
                    overview.student.courseTitles.length > 1
                      ? `+${overview.student.courseTitles.length - 1} more`
                      : undefined
                  }
                />
              </div>
            </AdminCard>
          </motion.div>

          {/* Stat cards */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<ClipboardList className="h-5 w-5" />}
              tone="sky"
              label="Total Exams"
              value={String(overview.stats.totalExams)}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              tone="emerald"
              label="Average Score"
              value={`${overview.stats.averagePercent}%`}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              tone="violet"
              label="Highest Score"
              value={
                overview.stats.highestScore
                  ? `${formatMarks(overview.stats.highestScore.score)} / ${overview.stats.highestScore.total}`
                  : "—"
              }
            />
            <StatCard
              icon={<TrendingDown className="h-5 w-5" />}
              tone="amber"
              label="Lowest Score"
              value={
                overview.stats.lowestScore
                  ? `${formatMarks(overview.stats.lowestScore.score)} / ${overview.stats.lowestScore.total}`
                  : "—"
              }
            />
          </motion.div>

          {/* Question summary for the focused attempt */}
          {overview.focusAttempt ? (
            <motion.div variants={fadeUp}>
              <AdminCard className="p-5">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold text-navy">Question Summary</h2>
                  <p className="text-xs text-slate-400">
                    {overview.focusAttempt.examTitle} ·{" "}
                    {formatAdminDate(overview.focusAttempt.submittedAt)} · completed in{" "}
                    {formatCompletionTime(overview.focusAttempt.timeTakenSec)}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <QuestionStat
                    icon={<FileQuestion className="h-5 w-5" />}
                    tone="slate"
                    label="Total Questions"
                    value={overview.focusAttempt.questionSummary.totalQuestions}
                  />
                  <QuestionStat
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    tone="emerald"
                    label="Correct Answers"
                    value={overview.focusAttempt.questionSummary.correct}
                  />
                  <QuestionStat
                    icon={<XCircle className="h-5 w-5" />}
                    tone="red"
                    label="Wrong Answers"
                    value={overview.focusAttempt.questionSummary.wrong}
                  />
                  <QuestionStat
                    icon={<SkipForward className="h-5 w-5" />}
                    tone="amber"
                    label="Unanswered Questions"
                    value={overview.focusAttempt.questionSummary.unanswered}
                  />
                </div>
              </AdminCard>
            </motion.div>
          ) : null}

          {/* Performance trend */}
          <motion.div variants={fadeUp}>
            <AdminCard className="p-5">
              <h2 className="mb-4 text-base font-semibold text-navy">
                Performance Trend (All Exams)
              </h2>
              {overview.trend.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No submitted exams to chart yet.
                </p>
              ) : (
                <TrendChart points={overview.trend} />
              )}
            </AdminCard>
          </motion.div>

          {/* Exam history */}
          <motion.div variants={fadeUp}>
            <AdminCard className="overflow-hidden p-0">
              <h2 className="border-b border-slate-100 px-5 py-4 text-base font-semibold text-navy">
                Exam History
              </h2>
              {overview.history.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">
                  This student has not submitted any exams yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70">
                        <Th>Exam</Th>
                        <Th>Subject</Th>
                        <Th>Date</Th>
                        <Th>Obtained Mark</Th>
                        <Th className="text-right">Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.history.map((item) => (
                        <tr
                          key={item.attemptId}
                          className={cn(
                            "border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60",
                            item.attemptId === attemptId && "bg-accent/5",
                          )}
                        >
                          <Td>
                            <Link
                              href={`/admin/exams/monitoring/${item.attemptId}`}
                              className="font-semibold text-navy hover:text-accent"
                            >
                              {item.examTitle}
                            </Link>
                          </Td>
                          <Td className="text-slate-500">{item.subject}</Td>
                          <Td className="text-slate-500">
                            {formatAdminDate(item.submittedAt)}
                          </Td>
                          <Td>
                            <span
                              className={cn(
                                "font-semibold",
                                marksToneClass[marksTone(item.score, item.total)],
                              )}
                            >
                              {formatMarks(item.score)}
                            </span>
                            <span className="text-slate-400"> / {item.total}</span>
                          </Td>
                          <Td className="text-right">
                            <AdminBadge variant="success">Completed</AdminBadge>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function formatMarks(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

const statTones = {
  sky: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
} as const;

function StatCard({
  icon,
  tone,
  label,
  value,
}: {
  icon: React.ReactNode;
  tone: keyof typeof statTones;
  label: string;
  value: string;
}) {
  return (
    <AdminCard className="flex items-center gap-3.5 p-4">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          statTones[tone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="truncate text-xl font-bold text-navy">{value}</div>
      </div>
    </AdminCard>
  );
}

function QuestionStat({
  icon,
  tone,
  label,
  value,
}: {
  icon: React.ReactNode;
  tone: keyof typeof statTones;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          statTones[tone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="text-xl font-bold text-navy">{value}</div>
      </div>
    </div>
  );
}

function DetailCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="lg:pl-5">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 font-semibold text-navy">{value}</div>
      {hint ? <div className="text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-5 py-3.5 text-sm", className)}>{children}</td>;
}

const CHART = {
  width: 760,
  height: 280,
  padTop: 28,
  padRight: 28,
  padBottom: 40,
  // Wide enough for the rotated "Score (%)" axis title plus the tick numbers.
  padLeft: 64,
};

/**
 * Score-over-time line chart, hand-rolled as inline SVG.
 *
 * The Y axis snaps to 10-point gridlines around the observed range rather than
 * always spanning 0–100, so a run of high scores still shows its shape.
 */
function TrendChart({
  points,
}: {
  points: { attemptId: string; label: string; percent: number }[];
}) {
  const values = points.map((point) => point.percent);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);

  const min = Math.max(0, Math.floor((rawMin - 5) / 10) * 10);
  const max = Math.min(100, Math.ceil((rawMax + 5) / 10) * 10);
  const span = Math.max(10, max - min);

  const plotWidth = CHART.width - CHART.padLeft - CHART.padRight;
  const plotHeight = CHART.height - CHART.padTop - CHART.padBottom;

  const x = (index: number) =>
    points.length === 1
      ? CHART.padLeft + plotWidth / 2
      : CHART.padLeft + (index / (points.length - 1)) * plotWidth;
  const y = (percent: number) =>
    CHART.padTop + plotHeight - ((percent - min) / span) * plotHeight;

  const ticks: number[] = [];
  for (let value = min; value <= max; value += 10) ticks.push(value);

  const line = points.map((point, index) => `${x(index)},${y(point.percent)}`).join(" ");
  const area = `${x(0)},${CHART.padTop + plotHeight} ${line} ${x(points.length - 1)},${CHART.padTop + plotHeight}`;

  // Direct labels stay sparing — first, last, highest and lowest — so they never
  // stack on each other. The gridline ticks and the history table carry the rest.
  const labelledIndexes = new Set([
    0,
    points.length - 1,
    values.indexOf(rawMax),
    values.indexOf(rawMin),
  ]);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className="h-auto w-full min-w-[560px]"
        role="img"
        aria-label={`Score percentage across the last ${points.length} exams`}
      >
        <text
          transform="rotate(-90)"
          x={-(CHART.padTop + plotHeight / 2)}
          y={16}
          textAnchor="middle"
          className="fill-slate-400"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          Score (%)
        </text>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={CHART.padLeft}
              x2={CHART.width - CHART.padRight}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-slate-200"
              strokeWidth={1}
              strokeDasharray={tick === min ? undefined : "4 4"}
            />
            <text
              x={CHART.padLeft - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-slate-400"
              style={{ fontSize: 11 }}
            >
              {tick}
            </text>
          </g>
        ))}

        <polygon points={area} className="fill-accent/10" />
        <polyline
          points={line}
          fill="none"
          className="stroke-accent"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => {
          const pointY = y(point.percent);
          const hasHeadroom = pointY - CHART.padTop > 16;

          // The first and last points sit right on the plot edges, so centring
          // their label would push it over the tick numbers (or off the canvas).
          // Anchor those inward instead; everything between stays centred.
          const isFirst = index === 0 && points.length > 1;
          const isLast = index === points.length - 1 && points.length > 1;
          const labelAnchor = isFirst ? "start" : isLast ? "end" : "middle";
          const labelX = isFirst ? x(index) + 8 : isLast ? x(index) - 8 : x(index);

          return (
            <g key={point.attemptId}>
              <circle
                cx={x(index)}
                cy={pointY}
                r={4.5}
                className="fill-white stroke-accent"
                strokeWidth={2.5}
              />
              {labelledIndexes.has(index) ? (
                <text
                  x={labelX}
                  y={hasHeadroom ? pointY - 12 : pointY + 20}
                  textAnchor={labelAnchor}
                  className="fill-navy"
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {point.percent}%
                </text>
              ) : null}
              <text
                x={x(index)}
                y={CHART.height - 14}
                textAnchor="middle"
                className="fill-slate-400"
                style={{ fontSize: 11 }}
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
