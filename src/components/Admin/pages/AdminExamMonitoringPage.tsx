"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileCheck2,
  GraduationCap,
  Layers,
  Search,
  Users,
  X,
} from "lucide-react";

import {
  AdminAvatar,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminInput,
  AdminLoading,
  AdminSelect,
  type AdminPaginationMeta,
} from "@/components/Admin";
import { adminFetch } from "@/lib/admin/client";
import {
  formatClassLabel,
  formatCompletionTime,
  marksTone,
} from "@/lib/exams/monitoring";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

type MonitoringResult = {
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
  submittedAt: string;
};

type MonitoringPayload = {
  results: MonitoringResult[];
  summary: { totalExams: number; totalStudents: number; totalResults: number };
  filterOptions: {
    classLevels: number[];
    courses: { id: string; title: string }[];
    exams: { id: string; title: string }[];
  };
  pagination: AdminPaginationMeta;
};

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

const marksToneClass = {
  good: "text-emerald-600",
  average: "text-amber-600",
  poor: "text-red-600",
} as const;

export default function AdminExamMonitoringPage() {
  const shouldReduceMotion = useReducedMotion();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [results, setResults] = useState<MonitoringResult[]>([]);
  const [summary, setSummary] = useState({
    totalExams: 0,
    totalStudents: 0,
    totalResults: 0,
  });
  const [filterOptions, setFilterOptions] = useState<
    MonitoringPayload["filterOptions"]
  >({ classLevels: [], courses: [], exams: [] });
  const [pagination, setPagination] = useState<AdminPaginationMeta>(emptyPagination);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(
    async (
      q: string,
      classLevel: string,
      courseId: string,
      examId: string,
      date: string,
      pg: number,
    ) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pg),
        limit: String(PAGE_SIZE),
      });
      if (q) params.set("search", q);
      if (classLevel) params.set("classLevel", classLevel);
      if (courseId) params.set("courseId", courseId);
      if (examId) params.set("examId", examId);
      if (date) params.set("date", date);

      const result = await adminFetch<MonitoringPayload>(
        `/api/admin/exams/monitoring?${params}`,
      );
      if (result.success && result.data) {
        setResults(result.data.results);
        setSummary(result.data.summary);
        setFilterOptions(result.data.filterOptions);
        setPagination(result.data.pagination);
      }
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => load(search, classFilter, courseFilter, examFilter, dateFilter, page),
      300,
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, classFilter, courseFilter, examFilter, dateFilter, page, load]);

  const hasActiveFilters = Boolean(
    search || classFilter || courseFilter || examFilter || dateFilter,
  );

  function resetFilters() {
    setSearch("");
    setClassFilter("");
    setCourseFilter("");
    setExamFilter("");
    setDateFilter("");
    setPage(1);
  }

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
          <li className="font-medium text-slate-500" aria-current="page">
            Exam Monitoring
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
        Exam Monitoring
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<ClipboardList className="h-6 w-6" />}
          tone="sky"
          label="Total Exams"
          value={summary.totalExams}
        />
        <SummaryCard
          icon={<Users className="h-6 w-6" />}
          tone="emerald"
          label="Total Students"
          value={summary.totalStudents}
        />
        <SummaryCard
          icon={<FileCheck2 className="h-6 w-6" />}
          tone="violet"
          label="Total Results"
          value={summary.totalResults}
        />
      </div>

      {/* Filters */}
      <AdminCard className="p-4">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <AdminInput
              placeholder="Search student..."
              aria-label="Search student"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:flex 2xl:shrink-0">
            <FilterSelect
              icon={<GraduationCap size={15} />}
              value={classFilter}
              ariaLabel="Filter by class"
              onChange={(value) => {
                setClassFilter(value);
                setPage(1);
              }}
            >
              <option value="">All Classes</option>
              {filterOptions.classLevels.map((level) => (
                <option key={level} value={level}>
                  {formatClassLabel(level)}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              icon={<BookOpen size={15} />}
              value={courseFilter}
              ariaLabel="Filter by course"
              onChange={(value) => {
                setCourseFilter(value);
                setPage(1);
              }}
            >
              <option value="">All Courses</option>
              {filterOptions.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              icon={<Layers size={15} />}
              value={examFilter}
              ariaLabel="Filter by exam"
              onChange={(value) => {
                setExamFilter(value);
                setPage(1);
              }}
            >
              <option value="">All Exams</option>
              {filterOptions.exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </FilterSelect>

            <div className="relative">
              <CalendarDays
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <AdminInput
                type="date"
                aria-label="Filter by date"
                value={dateFilter}
                onChange={(event) => {
                  setDateFilter(event.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {hasActiveFilters ? (
            <AdminButton variant="ghost" className="2xl:shrink-0" onClick={resetFilters}>
              <X size={15} /> Clear
            </AdminButton>
          ) : null}
        </div>
      </AdminCard>

      {/* Results table */}
      <AdminCard className="overflow-hidden p-0">
        {loading ? (
          <AdminLoading />
        ) : results.length === 0 ? (
          <div className="p-5">
            <AdminEmpty
              title="No exam results found"
              description={
                hasActiveFilters
                  ? "No submitted results match the current search and filters."
                  : "Results will appear here as soon as students start submitting exams."
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <Th>Student</Th>
                    <Th>Class / Course</Th>
                    <Th>Exam</Th>
                    <Th>Marks (Obtained / Total)</Th>
                    <Th>Completion Time</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                  initial="hidden"
                  animate="show"
                >
                  {results.map((row) => (
                    <motion.tr
                      key={row.attemptId}
                      variants={fadeUp}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                    >
                      <Td>
                        <div className="flex items-center gap-3">
                          <AdminAvatar name={row.studentName} src={row.avatarUrl} />
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-navy">
                              {row.studentName}
                            </div>
                            <div className="text-xs text-slate-400">
                              ID: {row.studentCode ?? "—"}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="font-semibold text-navy">
                          {formatClassLabel(row.classLevel)}
                        </div>
                        <div className="text-xs text-accent">
                          {row.courseTitle ?? "No course"}
                        </div>
                      </Td>
                      <Td className="text-slate-600">{row.examTitle}</Td>
                      <Td>
                        <span
                          className={cn(
                            "font-semibold",
                            marksToneClass[marksTone(row.score, row.total)],
                          )}
                        >
                          {formatMarks(row.score)}
                        </span>
                        <span className="text-slate-400"> / {row.total}</span>
                      </Td>
                      <Td className="text-slate-500">
                        {formatCompletionTime(row.timeTakenSec)}
                      </Td>
                      <Td className="text-right">
                        <Link href={`/admin/exams/monitoring/${row.attemptId}`}>
                          <AdminButton variant="ghost" size="sm">
                            <Eye size={14} /> View
                          </AdminButton>
                        </Link>
                      </Td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>

            <NumberedPagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </AdminCard>
    </div>
  );
}

/** Scores are stored as floats; whole numbers should not render as "85.00". */
function formatMarks(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

const summaryTones = {
  sky: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
} as const;

function SummaryCard({
  icon,
  tone,
  label,
  value,
}: {
  icon: React.ReactNode;
  tone: keyof typeof summaryTones;
  label: string;
  value: number;
}) {
  return (
    <AdminCard className="flex items-center gap-4 p-5">
      <span
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
          summaryTones[tone],
        )}
      >
        {icon}
      </span>
      <div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className="text-3xl font-bold leading-tight text-navy">
          {value.toLocaleString()}
        </div>
        <div className="text-xs text-slate-400">All time</div>
      </div>
    </AdminCard>
  );
}

function FilterSelect({
  icon,
  value,
  ariaLabel,
  onChange,
  children,
}: {
  icon: React.ReactNode;
  value: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative 2xl:w-44">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      <AdminSelect
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-9"
      >
        {children}
      </AdminSelect>
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

/**
 * Numbered pager with ellipses, matching the monitoring table design.
 *
 * Always shows the first and last page plus a window around the current one,
 * so the control stays a fixed width however many pages there are.
 */
function NumberedPagination({
  pagination,
  onPageChange,
}: {
  pagination: AdminPaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const { page, limit, total, totalPages } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-navy">{start}</span> to{" "}
        <span className="font-semibold text-navy">{end}</span> of{" "}
        <span className="font-semibold text-navy">{total.toLocaleString()}</span> entries
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        <PagerButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </PagerButton>

        {pageWindow(page, totalPages).map((entry, index) =>
          entry === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1.5 text-sm text-slate-400"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? "page" : undefined}
              className={cn(
                "h-9 min-w-9 rounded-lg px-2.5 text-sm font-semibold transition",
                entry === page
                  ? "bg-accent text-white"
                  : "border border-slate-200 bg-white text-navy hover:bg-slate-50",
              )}
            >
              {entry}
            </button>
          ),
        )}

        <PagerButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </PagerButton>
      </nav>
    </div>
  );
}

function PagerButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-navy transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function pageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page]);
  if (page - 1 > 1) pages.add(page - 1);
  if (page + 1 < totalPages) pages.add(page + 1);
  // Keep the control from collapsing to "1 … 16" when sitting on an edge.
  if (page <= 3) [2, 3, 4].forEach((value) => pages.add(value));
  if (page >= totalPages - 2) {
    [totalPages - 3, totalPages - 2, totalPages - 1].forEach((value) => pages.add(value));
  }

  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);

  const output: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) output.push("ellipsis");
    output.push(value);
    previous = value;
  }
  return output;
}
