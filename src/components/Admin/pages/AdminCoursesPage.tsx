"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  Eye,
  FileText,
  Globe,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminField,
  AdminInput,
  AdminImageUpload,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminSelect,
  AdminTextarea,
  type AdminPaginationMeta,
} from "@/components/Admin";
import Modal from "@/components/reusables/Modal";
import { adminFetch, formatAdminDate, slugifyInput } from "@/lib/admin/client";
import { courseLevelLabels } from "@/lib/courses/constants";
import type { CourseLevel } from "@/generated/prisma/client";

type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type Course = {
  id: string;
  title: string;
  slug: string;
  subject: string;
  category: string;
  instructorName: string;
  durationMinutes: number;
  thumbnailUrl: string;
  level: CourseLevel;
  status: CourseStatus;
  price: number;
  originalPrice: number | null;
  lessonCount: number;
  updatedAt: string;
  createdAt: string;
};

const statusVariant = {
  DRAFT: "muted" as const,
  PUBLISHED: "success" as const,
  ARCHIVED: "warning" as const,
};

const statusLabel = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const emptyForm = {
  title: "",
  shortDescription: "",
  category: "Mathematics",
  level: "CLASS_6" as CourseLevel,
  subject: "",
  instructorName: "",
  thumbnailUrl: "",
  price: 0,
  durationMinutes: 60,
  status: "DRAFT" as const,
};

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

type ConfirmAction =
  | { type: "archive"; course: Course }
  | { type: "unarchive"; course: Course }
  | { type: "delete"; course: Course }
  | null;

export default function AdminCoursesPage() {
  const shouldReduceMotion = useReducedMotion();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(emptyPagination);
  const [counts, setCounts] = useState({ DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 });

  // View modal
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

  // Confirm action modal (archive / unarchive / delete)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(emptyPagination.limit),
      sort,
    });
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);

    const res = await adminFetch<{
      courses: Course[];
      counts: typeof counts;
      pagination: AdminPaginationMeta;
    }>(`/api/admin/courses?${params}`);

    if (res.success && res.data) {
      setCourses(res.data.courses);
      setCounts(res.data.counts || { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 });
      setPagination(res.data.pagination || emptyPagination);
    }
    setLoading(false);
  }, [page, search, sort, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCourses();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadCourses]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.thumbnailUrl) {
      setFormError("Upload a course thumbnail before saving.");
      return;
    }
    setSaving(true);
    setFormError("");
    const res = await adminFetch<Course>("/api/admin/courses", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        slug: slugifyInput(form.title),
        lessonCount: 0,
        featured: false,
      }),
    });
    setSaving(false);
    if (res.success) {
      setShowForm(false);
      setForm(emptyForm);
      void loadCourses();
    } else {
      setFormError(res.message ?? "Could not create course.");
    }
  }

  async function executeAction() {
    if (!confirmAction) return;
    setActionLoading(true);

    if (confirmAction.type === "delete") {
      const res = await adminFetch(`/api/admin/courses/${confirmAction.course.id}`, {
        method: "DELETE",
      });
      setActionLoading(false);
      if (res.success) {
        setConfirmAction(null);
        setPreviewCourse(null);
        void loadCourses();
      }
    } else {
      const nextStatus =
        confirmAction.type === "archive"
          ? "ARCHIVED"
          : "DRAFT"; // unarchive → back to draft

      const res = await adminFetch(`/api/admin/courses/${confirmAction.course.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setActionLoading(false);
      if (res.success) {
        setConfirmAction(null);
        void loadCourses();
      }
    }
  }

  const totalCourses = counts.DRAFT + counts.PUBLISHED + counts.ARCHIVED;

  // ── Confirm modal config ─────────────────────────────────────────────────────
  const confirmConfig = confirmAction
    ? {
        archive: {
          icon: <Archive className="h-10 w-10 text-amber-500" />,
          title: "Archive this course?",
          description:
            "The course will be hidden from students and the website. You can restore it at any time from the Archived filter.",
          confirmLabel: "Archive",
          confirmClass:
            "bg-amber-500 hover:bg-amber-600 text-white",
        },
        unarchive: {
          icon: <RotateCcw className="h-10 w-10 text-sky-500" />,
          title: "Restore this course?",
          description:
            "The course will be moved back to Draft status. You can then edit and republish it.",
          confirmLabel: "Restore to Draft",
          confirmClass:
            "bg-sky-600 hover:bg-sky-700 text-white",
        },
        delete: {
          icon: <Trash2 className="h-10 w-10 text-red-500" />,
          title: "Permanently delete this course?",
          description:
            "This will delete the course and ALL its modules, lessons, and quizzes forever. This action cannot be undone.",
          confirmLabel: "Delete permanently",
          confirmClass:
            "bg-red-600 hover:bg-red-700 text-white",
        },
      }[confirmAction.type]
    : null;

  return (
    <div>
      <AdminPageHeader
        title="Courses"
        description="Create and manage courses. Published courses appear on the website."
        actions={
          <AdminButton onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            Add new course
          </AdminButton>
        }
      />

      {/* Stat cards */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Published" value={counts.PUBLISHED} icon={Globe} accent="text-emerald-600" />
        <StatCard label="Drafts" value={counts.DRAFT} icon={FileText} accent="text-slate-500" />
        <StatCard label="Archived" value={counts.ARCHIVED} icon={Archive} accent="text-amber-600" />
      </div>

      {/* Filters */}
      <AdminCard className="overflow-hidden p-0 mb-6">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <AdminInput
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by title, subject, or category..."
              />
            </div>
            <AdminSelect
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">All statuses ({totalCourses})</option>
              <option value="PUBLISHED">Published ({counts.PUBLISHED})</option>
              <option value="DRAFT">Drafts ({counts.DRAFT})</option>
              <option value="ARCHIVED">Archived ({counts.ARCHIVED})</option>
            </AdminSelect>
            <AdminSelect
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              aria-label="Sort courses"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title-asc">Title A–Z</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="price-asc">Price: Low → High</option>
            </AdminSelect>
          </div>
        </div>
      </AdminCard>

      {/* Create form */}
      {showForm ? (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AdminCard className="mb-6">
            <h2 className="mb-4 text-lg font-semibold text-navy">New course</h2>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Course title" hint="The name students will see">
                <AdminInput
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </AdminField>
              <AdminField label="Subject">
                <AdminInput
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </AdminField>
              <AdminField label="Category">
                <AdminInput
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </AdminField>
              <AdminField label="Class level">
                <AdminSelect
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as CourseLevel })}
                >
                  {Object.entries(courseLevelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
              <AdminField label="Instructor name">
                <AdminInput
                  required
                  value={form.instructorName}
                  onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                />
              </AdminField>
              <AdminField label="Price (BDT)">
                <AdminInput
                  type="number"
                  min={0}
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </AdminField>
              <AdminField label="Duration (minutes)">
                <AdminInput
                  type="number"
                  min={1}
                  required
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: Number(e.target.value) })
                  }
                />
              </AdminField>
              <div className="sm:col-span-2">
                <AdminImageUpload
                  label="Course thumbnail"
                  value={form.thumbnailUrl}
                  onChange={(thumbnailUrl) => setForm({ ...form, thumbnailUrl })}
                  onUploadingChange={setImageUploading}
                  purpose="course-thumbnail"
                  aspect="video"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <AdminField label="Short description">
                  <AdminTextarea
                    required
                    value={form.shortDescription}
                    onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  />
                </AdminField>
              </div>
              <AdminField label="Status">
                <AdminSelect
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as typeof form.status })
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </AdminSelect>
              </AdminField>
              {formError ? (
                <p className="text-sm text-red-600 sm:col-span-2">{formError}</p>
              ) : null}
              <div className="flex gap-2 sm:col-span-2">
                <AdminButton
                  type="submit"
                  isLoading={saving}
                  disabled={imageUploading || !form.thumbnailUrl}
                >
                  Save course
                </AdminButton>
                <AdminButton type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </AdminButton>
              </div>
            </form>
          </AdminCard>
        </motion.div>
      ) : null}

      {/* Table */}
      {loading ? (
        <AdminLoading label="Loading courses..." />
      ) : courses.length === 0 ? (
        <AdminEmpty
          title="No courses found"
          description={
            search || status
              ? "Try changing your search or filter."
              : "Create your first course to get started."
          }
          actionLabel="Add new course"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3 font-semibold text-navy">Title</th>
                  <th className="px-5 py-3 font-semibold text-navy">Subject</th>
                  <th className="px-5 py-3 font-semibold text-navy">Level</th>
                  <th className="px-5 py-3 font-semibold text-navy">Status</th>
                  <th className="px-5 py-3 font-semibold text-navy">Updated</th>
                  <th className="px-5 py-3 text-right font-semibold text-navy">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course, index) => (
                  <motion.tr
                    key={course.id}
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors ${
                      course.status === "ARCHIVED" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-navy max-w-[220px] truncate">
                        {course.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">৳{course.price.toLocaleString()}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{course.subject}</td>
                    <td className="px-5 py-4 text-slate-600">{courseLevelLabels[course.level]}</td>
                    <td className="px-5 py-4">
                      <AdminBadge variant={statusVariant[course.status]}>
                        {statusLabel[course.status]}
                      </AdminBadge>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatAdminDate(course.updatedAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View */}
                        <ActionBtn
                          title="View Details"
                          onClick={() => setPreviewCourse(course)}
                        >
                          <Eye className="h-4 w-4" />
                        </ActionBtn>

                        {/* Edit */}
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-navy transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                          title="Edit Course"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>

                        {/* Archive / Unarchive */}
                        {course.status !== "ARCHIVED" ? (
                          <ActionBtn
                            title="Archive Course"
                            hoverClass="hover:border-amber-400/40 hover:bg-amber-50 hover:text-amber-600"
                            onClick={() =>
                              setConfirmAction({ type: "archive", course })
                            }
                          >
                            <Archive className="h-4 w-4" />
                          </ActionBtn>
                        ) : (
                          <ActionBtn
                            title="Restore Course"
                            hoverClass="hover:border-sky-400/40 hover:bg-sky-50 hover:text-sky-600"
                            onClick={() =>
                              setConfirmAction({ type: "unarchive", course })
                            }
                          >
                            <RotateCcw className="h-4 w-4" />
                          </ActionBtn>
                        )}

                        {/* Permanent delete — only for archived */}
                        {course.status === "ARCHIVED" && (
                          <ActionBtn
                            title="Permanently Delete"
                            hoverClass="hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                            onClick={() =>
                              setConfirmAction({ type: "delete", course })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </ActionBtn>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination pagination={pagination} onPageChange={setPage} />
        </AdminCard>
      )}

      {/* ── Preview / View modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={previewCourse !== null}
        onClose={() => setPreviewCourse(null)}
        title="Course Overview"
        size="lg"
      >
        {previewCourse ? (
          <div className="p-6 sm:p-7">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-5 pr-8">
              <AdminBadge variant={statusVariant[previewCourse.status]}>
                {statusLabel[previewCourse.status]}
              </AdminBadge>
              <span className="text-xs text-slate-400">
                Created {formatAdminDate(previewCourse.createdAt)}
              </span>
            </div>

            {/* Thumbnail + Info */}
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="w-full sm:w-2/5 shrink-0">
                {previewCourse.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewCourse.thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full rounded-xl aspect-video object-cover shadow"
                  />
                ) : (
                  <div className="w-full aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                    No Thumbnail
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-navy leading-tight">{previewCourse.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5 mb-4 font-mono">{previewCourse.slug}</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoTile label="Price" value={`৳${previewCourse.price.toLocaleString()}`} />
                  <InfoTile
                    label="Level"
                    value={courseLevelLabels[previewCourse.level]}
                  />
                  <InfoTile label="Subject" value={previewCourse.subject} />
                  <InfoTile label="Category" value={previewCourse.category} />
                  <InfoTile label="Instructor" value={previewCourse.instructorName} />
                  <InfoTile
                    label="Lessons / Duration"
                    value={`${previewCourse.lessonCount} lessons · ${previewCourse.durationMinutes} min`}
                  />
                </div>
              </div>
            </div>

            {/* Action footer */}
            <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
              {/* Left side: archive / unarchive / delete */}
              <div className="flex flex-wrap gap-2">
                {previewCourse.status !== "ARCHIVED" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewCourse(null);
                      setConfirmAction({ type: "archive", course: previewCourse });
                    }}
                    className="inline-flex items-center gap-2 h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-amber-600 transition hover:bg-amber-50 hover:border-amber-300"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewCourse(null);
                        setConfirmAction({ type: "unarchive", course: previewCourse });
                      }}
                      className="inline-flex items-center gap-2 h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-50 hover:border-sky-300"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewCourse(null);
                        setConfirmAction({ type: "delete", course: previewCourse });
                      }}
                      className="inline-flex items-center gap-2 h-10 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete permanently
                    </button>
                  </>
                )}
              </div>
              {/* Right: Edit */}
              <Link
                href={`/admin/courses/${previewCourse.id}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy/90"
              >
                <Pencil className="h-4 w-4" />
                Edit Course
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ── Confirm action modal (archive / unarchive / delete) ───────────────── */}
      <Modal
        isOpen={confirmAction !== null}
        onClose={() => !actionLoading && setConfirmAction(null)}
        size="sm"
      >
        {confirmAction && confirmConfig ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
              {confirmConfig.icon}
            </div>
            <h2 className="text-lg font-bold text-navy mb-2">{confirmConfig.title}</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-1">{confirmConfig.description}</p>
            <p className="text-sm font-semibold text-navy mt-3 mb-6 truncate px-4">
              "{confirmAction.course.title}"
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void executeAction()}
                disabled={actionLoading}
                className={`inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:opacity-60 ${confirmConfig.confirmClass}`}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {confirmConfig.confirmLabel}
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
                className="inline-flex w-full h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function ActionBtn({
  children,
  title,
  onClick,
  hoverClass = "hover:border-accent/40 hover:bg-accent/5 hover:text-accent",
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  hoverClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-navy transition ${hoverClass}`}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-navy">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-navy truncate" title={value}>
        {value}
      </p>
    </div>
  );
}
