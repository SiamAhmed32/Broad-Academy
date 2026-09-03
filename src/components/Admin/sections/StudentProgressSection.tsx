"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Eye, Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  AdminAvatar,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardTitle,
  AdminEmpty,
  AdminInput,
  AdminLoading,
  AdminPagination,
  AdminSelect,
  type AdminPaginationMeta,
} from "@/components/Admin";
import {
  STUDENT_PROGRESS_TONES,
  StudentProgressBadge,
  StudentProgressBar,
} from "@/components/Admin/ui/StudentProgressBadge";
import { adminFetch } from "@/lib/admin/client";
import {
  formatLastActive,
  STUDENT_PROGRESS_STATUS_LABELS,
  type StudentProgressStatus,
} from "@/lib/students/progress";
import { cn } from "@/lib/utils";

type StudentProgressRecord = {
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
  openRequestCount: number;
  enrolledAt: string | null;
  courseCount: number;
  courseTitles: string[];
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  lastActiveAt: string | null;
  status: StudentProgressStatus;
};

type ProgressSummary = { total: number } & Record<StudentProgressStatus, number>;

type ProgressResponse = {
  students: StudentProgressRecord[];
  summary: ProgressSummary;
  classLevels: number[];
  truncated: boolean;
  pagination: AdminPaginationMeta;
};

type CourseOption = { id: string; title: string };

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 1,
};

const emptySummary: ProgressSummary = {
  total: 0,
  ON_TRACK: 0,
  NEEDS_ATTENTION: 0,
  AT_RISK: 0,
  COMPLETED: 0,
  NOT_ENROLLED: 0,
};

/** The four buckets shown as summary cards, in the order from the design. */
const SUMMARY_CARD_STATUSES: StudentProgressStatus[] = [
  "ON_TRACK",
  "NEEDS_ATTENTION",
  "AT_RISK",
  "COMPLETED",
];

type StudentProgressSectionProps = {
  onTotalChange?: (total: number) => void;
};

export function StudentProgressSection({ onTotalChange }: StudentProgressSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const [students, setStudents] = useState<StudentProgressRecord[]>([]);
  const [summary, setSummary] = useState<ProgressSummary>(emptySummary);
  const [classLevels, setClassLevels] = useState<number[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(emptyPagination);
  const [truncated, setTruncated] = useState(false);

  const [search, setSearch] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState<StudentProgressStatus | "all">("all");
  const [sort, setSort] = useState("progress_asc");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(emptyPagination.limit),
      status,
      sort,
    });
    if (search.trim()) params.set("search", search.trim());
    if (classLevel) params.set("classLevel", classLevel);
    if (courseId) params.set("courseId", courseId);

    const res = await adminFetch<ProgressResponse>(
      `/api/admin/students/progress?${params}`,
    );

    if (res.success && res.data) {
      setStudents(res.data.students);
      setSummary(res.data.summary);
      setClassLevels(res.data.classLevels);
      setPagination(res.data.pagination);
      setTruncated(res.data.truncated);
      setErrorMessage(null);
      onTotalChange?.(res.data.summary.total);
    } else {
      setErrorMessage(res.message ?? "Could not load student progress.");
    }
    setLoading(false);
  }, [classLevel, courseId, onTotalChange, page, search, sort, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStudents(), 280);
    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  useEffect(() => {
    void adminFetch<{ courses: CourseOption[] }>(
      "/api/admin/courses?limit=100&compact=true",
    ).then((res) => {
      if (res.success && res.data) setCourses(res.data.courses);
    });
  }, []);

  function resetFilters() {
    setSearch("");
    setClassLevel("");
    setCourseId("");
    setStatus("all");
    setPage(1);
  }

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total Students"
          hint="All student accounts"
          value={summary.total}
          icon={Users}
          tone="bg-sky-50 text-sky-600"
          active={status === "all"}
          onClick={() => {
            setStatus("all");
            setPage(1);
          }}
          reduceMotion={shouldReduceMotion}
          index={0}
        />
        {SUMMARY_CARD_STATUSES.map((cardStatus, index) => {
          const tone = STUDENT_PROGRESS_TONES[cardStatus];
          const value = summary[cardStatus];
          const share =
            summary.total > 0 ? Math.round((value / summary.total) * 1000) / 10 : 0;

          return (
            <SummaryCard
              key={cardStatus}
              label={tone.label}
              hint={`${share}% of students`}
              value={value}
              icon={tone.icon}
              tone={tone.tile}
              active={status === cardStatus}
              onClick={() => {
                setStatus(status === cardStatus ? "all" : cardStatus);
                setPage(1);
              }}
              reduceMotion={shouldReduceMotion}
              index={index + 1}
            />
          );
        })}
      </div>

      <AdminCard className="overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <AdminCardTitle>Student learning progress</AdminCardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Overall lesson completion across every course a student is enrolled in.
            Select a course to measure progress in that course only.
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <AdminInput
                className="pl-10"
                placeholder="Search student by name, email, phone or ID..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <AdminSelect
              aria-label="Filter by class"
              value={classLevel}
              onChange={(event) => {
                setClassLevel(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Classes</option>
              {classLevels.map((level) => (
                <option key={level} value={String(level)}>
                  Class {level}
                </option>
              ))}
            </AdminSelect>

            <AdminSelect
              aria-label="Filter by course"
              value={courseId}
              onChange={(event) => {
                setCourseId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </AdminSelect>

            <AdminSelect
              aria-label="Filter by status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StudentProgressStatus | "all");
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              {(
                [
                  "ON_TRACK",
                  "NEEDS_ATTENTION",
                  "AT_RISK",
                  "COMPLETED",
                  "NOT_ENROLLED",
                ] as StudentProgressStatus[]
              ).map((option) => (
                <option key={option} value={option}>
                  {STUDENT_PROGRESS_STATUS_LABELS[option]}
                </option>
              ))}
            </AdminSelect>

            <AdminSelect
              aria-label="Sort students"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
            >
              <option value="progress_asc">Lowest progress first</option>
              <option value="progress_desc">Highest progress first</option>
              <option value="last_active_asc">Least recently active</option>
              <option value="last_active_desc">Most recently active</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="class_asc">Class (low to high)</option>
            </AdminSelect>
          </div>

          {truncated ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Showing the 5,000 most recent students. Narrow the search, class, or
              course filter for exact totals.
            </p>
          ) : null}
        </div>

        {loading ? (
          <AdminLoading label="Loading student progress..." />
        ) : errorMessage ? (
          <div className="px-5 py-6">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          </div>
        ) : students.length === 0 ? (
          <AdminEmpty
            title="No students found"
            description="No student matches the current search and filters."
            actionLabel="Clear filters"
            onAction={resetFilters}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-navy">Student</th>
                    <th className="px-5 py-3 font-semibold text-navy">Class</th>
                    <th className="px-5 py-3 font-semibold text-navy">Course</th>
                    <th className="px-5 py-3 font-semibold text-navy">
                      Overall Progress
                    </th>
                    <th className="px-5 py-3 font-semibold text-navy">Status</th>
                    <th className="px-5 py-3 font-semibold text-navy">Last Active</th>
                    <th className="px-5 py-3 font-semibold text-navy">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const tone = STUDENT_PROGRESS_TONES[student.status];

                    return (
                      <motion.tr
                        key={student.id}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <AdminAvatar
                              name={student.fullName}
                              src={student.avatarUrl}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/students/${student.id}`}
                                  className="truncate font-medium text-navy hover:text-accent hover:underline"
                                >
                                  {student.fullName}
                                </Link>
                                {student.accountStatus === "SUSPENDED" ? (
                                  <AdminBadge variant="danger">Suspended</AdminBadge>
                                ) : null}
                              </div>
                              <div className="max-w-[240px] truncate text-xs text-slate-500">
                                {student.email}
                              </div>
                              {student.studentId ? (
                                <div className="text-xs text-slate-400">
                                  ID: {student.studentId}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {student.classLevel ? `Class ${student.classLevel}` : "—"}
                        </td>

                        <td className="px-5 py-4">
                          {student.courseTitles.length === 0 ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <div className="max-w-[220px]">
                              <p className="truncate text-slate-700">
                                {student.courseTitles[0]}
                              </p>
                              {student.courseTitles.length > 1 ? (
                                <p className="mt-0.5 text-xs text-slate-400">
                                  +{student.courseTitles.length - 1} more
                                </p>
                              ) : null}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StudentProgressBar
                            percent={student.progressPercent}
                            status={student.status}
                            subLabel={
                              student.totalLessons > 0
                                ? `${student.completedLessons}/${student.totalLessons}`
                                : undefined
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <StudentProgressBadge status={student.status} />
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-slate-600">
                            <span
                              className={cn("h-1.5 w-1.5 rounded-full", tone.dot)}
                              aria-hidden
                            />
                            {formatLastActive(student.lastActiveAt)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <Link href={`/admin/students/${student.id}`}>
                            <AdminButton size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                              View
                            </AdminButton>
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <AdminPagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </AdminCard>

    </>
  );
}

function SummaryCard({
  label,
  hint,
  value,
  icon: Icon,
  tone,
  active,
  onClick,
  reduceMotion,
  index,
}: {
  label: string;
  hint: string;
  value: number;
  icon: typeof Users;
  tone: string;
  active: boolean;
  onClick: () => void;
  reduceMotion: boolean | null;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        active ? "border-navy ring-2 ring-navy/10" : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-navy">{value.toLocaleString()}</p>
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
    </motion.button>
  );
}
