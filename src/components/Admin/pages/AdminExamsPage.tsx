"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClipboardCheck,
  Filter,
  Globe,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminField,
  AdminImageUpload,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminSelect,
  AdminTextarea,
  type AdminPaginationMeta,
  useAdminToast,
} from "@/components/Admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminFetch, formatAdminDate, slugifyInput } from "@/lib/admin/client";

type ExamStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type Exam = {
  id: string;
  slug: string;
  title: string;
  code: string | null;
  description: string | null;
  bannerUrl: string | null;
  price: number;
  originalPrice: number | null;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
  status: ExamStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  _count: { questions: number; attempts: number };
};

const statusVariant = {
  DRAFT: "muted" as const,
  PUBLISHED: "success" as const,
  ARCHIVED: "warning" as const,
};

const emptyForm = {
  title: "",
  slug: "",
  code: "EXAM",
  description: "",
  bannerUrl: "",
  price: 0,
  originalPrice: "",
  durationMinutes: 30,
  totalMarks: 30,
  negativeMarking: 0.25,
  status: "DRAFT" as ExamStatus,
};

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 1,
};

export default function AdminExamsPage() {
  const shouldReduceMotion = useReducedMotion();
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showToast, ToastViewport } = useAdminToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(emptyPagination);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);
  const dialogBodyRef = useRef<HTMLDivElement>(null);
  const savingRef = useRef(false);

  const loadExams = useCallback(async (
    q: string,
    st: string,
    price: string,
    pg: number,
  ) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pg), limit: "15" });
    if (q) params.set("search", q);
    if (st) params.set("status", st);
    if (price) params.set("price", price);
    const result = await adminFetch<{
      exams: Exam[];
      pagination: AdminPaginationMeta;
      counts: typeof counts;
    }>(`/api/admin/exams?${params}`);
    if (result.success && result.data) {
      setExams(result.data.exams);
      setPagination(result.data.pagination);
      setCounts(result.data.counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(
      () => loadExams(search, statusFilter, priceFilter, page),
      300,
    );
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [search, statusFilter, priceFilter, page, loadExams]);

  function openCreate() {
    setEditingExam(null);
    setForm(emptyForm);
    setFormError("");
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(exam: Exam) {
    setEditingExam(exam);
    setForm({
      title: exam.title,
      slug: slugifyInput(exam.title),
      code: exam.code ?? "EXAM",
      description: exam.description ?? "",
      bannerUrl: exam.bannerUrl ?? "",
      price: exam.price,
      originalPrice: exam.originalPrice != null ? String(exam.originalPrice) : "",
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      negativeMarking: exam.negativeMarking,
      status: exam.status,
    });
    setFormError("");
    setFieldErrors({});
    setModalOpen(true);
  }

  function resetExamDialogState() {
    setEditingExam(null);
    setForm(emptyForm);
    setFormError("");
    setFieldErrors({});
  }

  function closeExamDialog() {
    setModalOpen(false);
    resetExamDialogState();
  }

  function preventDismissWhileSaving(event: Event) {
    if (savingRef.current) {
      event.preventDefault();
    }
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "title") {
        next.slug = slugifyInput(value);
      }
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      if (name === "title") delete next.slug;
      return next;
    });
  }

  async function handleSave() {
    savingRef.current = true;
    setSaving(true);
    setFormError("");
    setFieldErrors({});

    const editingId = editingExam?.id;
    const isEditing = Boolean(editingId);
    const payload = {
      title: form.title.trim(),
      slug: slugifyInput(form.title.trim()),
      code: form.code.trim() || "EXAM",
      description: form.description.trim() || null,
      bannerUrl: form.bannerUrl.trim() || null,
      price: Number(form.price),
      originalPrice: form.originalPrice !== "" ? Number(form.originalPrice) : null,
      durationMinutes: Number(form.durationMinutes),
      totalMarks: Number(form.totalMarks),
      negativeMarking: Number(form.negativeMarking),
      status: form.status,
      ...(editingExam
        ? {
            startsAt: editingExam.startsAt,
            endsAt: editingExam.endsAt,
          }
        : {}),
    };

    const url = editingId ? `/api/admin/exams/${editingId}` : "/api/admin/exams";
    const method = editingId ? "PUT" : "POST";

    try {
      const result = await adminFetch<Exam>(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (!result.success) {
        setFormError(result.message ?? "Failed to save exam.");
        if (result.fields) setFieldErrors(result.fields);
        showToast(result.message ?? "Failed to save exam.", true);
        dialogBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      showToast(isEditing ? "Exam updated." : "Exam created.");
      closeExamDialog();
      void loadExams(search, statusFilter, priceFilter, page);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await adminFetch(`/api/admin/exams/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (result.success) {
      setDeleteTarget(null);
      showToast("Exam deleted.");
      loadExams(search, statusFilter, priceFilter, page);
    } else {
      showToast(result.message ?? "Delete failed.", true);
    }
    setDeleting(false);
  }

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };
  const hasActiveFilters = Boolean(search || statusFilter || priceFilter);

  return (
    <div className="space-y-6">
      {ToastViewport}

      <AdminPageHeader
        title="Standalone Exams"
        description="Create and manage public exam competitions"
        actions={
          <AdminButton onClick={openCreate}>
            <Plus size={16} /> New Exam
          </AdminButton>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((s) => (
          <AdminCard
            key={s}
            className="p-4 text-center cursor-pointer hover:opacity-80 transition"
            onClick={() => {
              setStatusFilter(s === statusFilter ? "" : s);
              setPage(1);
            }}
          >
            <div className="text-2xl font-bold text-navy">{counts[s]}</div>
            <div className="text-xs text-slate-400 mt-1">{s}</div>
          </AdminCard>
        ))}
      </div>

      {/* Filters */}
      <AdminCard className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <AdminInput
              placeholder="Search by exam title, code, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 xl:min-w-[360px]"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:shrink-0 xl:items-center">
            <AdminSelect
              value={statusFilter}
              aria-label="Filter by status"
              className="xl:w-44"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </AdminSelect>
            <AdminSelect
              value={priceFilter}
              aria-label="Filter by price"
              className="xl:w-36"
              onChange={(e) => {
                setPriceFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Pricing</option>
              <option value="FREE">Free</option>
              <option value="PAID">Paid</option>
            </AdminSelect>
          </div>
          {hasActiveFilters ? (
            <AdminButton
              variant="ghost"
              size="md"
              className="xl:shrink-0"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPriceFilter("");
                setPage(1);
              }}
            >
              <X size={15} /> Clear
            </AdminButton>
          ) : (
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-500 xl:flex xl:h-10 xl:shrink-0">
              <Filter size={15} /> Filters
            </div>
          )}
        </div>
      </AdminCard>

      {/* List */}
      {loading ? (
        <AdminLoading />
      ) : exams.length === 0 ? (
        <AdminEmpty
          title="No exams found"
          description={
            hasActiveFilters
              ? "No exams match the current search and filters."
              : "Create your first exam to get started."
          }
          actionLabel={hasActiveFilters ? undefined : "New Exam"}
          onAction={hasActiveFilters ? undefined : openCreate}
        />
      ) : (
        <motion.div
          className="space-y-3"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="show"
        >
          {exams.map((exam) => (
            <motion.div key={exam.id} variants={fadeUp}>
              <AdminCard className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy truncate">{exam.title}</span>
                      <AdminBadge variant={statusVariant[exam.status]}>{exam.status}</AdminBadge>
                      {exam.price === 0 ? (
                        <AdminBadge variant="success">FREE</AdminBadge>
                      ) : (
                        <AdminBadge variant="info">৳{exam.price}</AdminBadge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="font-mono">{exam.code}</span>
                      <span>{exam._count.questions} Qs</span>
                      <span>{exam._count.attempts} attempts</span>
                      <span>{exam.durationMinutes} min · {exam.totalMarks} marks</span>
                      <span>Updated {formatAdminDate(exam.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/admin/exams/${exam.id}/questions`}>
                      <AdminButton variant="ghost" size="sm">
                        <ClipboardCheck size={14} /> Questions
                      </AdminButton>
                    </Link>
                    <Link href={`/exams/${exam.slug}`} target="_blank">
                      <AdminButton variant="ghost" size="sm">
                        <Globe size={14} />
                      </AdminButton>
                    </Link>
                    <AdminButton variant="ghost" size="sm" onClick={() => openEdit(exam)}>
                      <Pencil size={14} />
                    </AdminButton>
                    <AdminButton variant="ghost" size="sm" onClick={() => setDeleteTarget(exam)}>
                      <Trash2 size={14} />
                    </AdminButton>
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AdminPagination pagination={pagination} onPageChange={setPage} />

      {/* Create/Edit Dialog — mount only while open so Radix can't reopen after save */}
      {modalOpen ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) closeExamDialog();
          }}
        >
          <DialogContent
            className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0"
            onPointerDownOutside={preventDismissWhileSaving}
            onEscapeKeyDown={preventDismissWhileSaving}
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <DialogHeader className="border-b border-slate-100 px-6 py-5">
                <DialogTitle>
                  {editingExam ? "Edit Exam" : "Create New Exam"}
                </DialogTitle>
                <DialogDescription>
                  Exams are available as soon as they are published.
                </DialogDescription>
              </DialogHeader>

              <div
                ref={dialogBodyRef}
                className="flex-1 space-y-6 overflow-y-auto px-6 py-5"
              >
            {formError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Basic information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AdminField label="Title" error={fieldErrors.title?.[0]} className="sm:col-span-2">
                  <AdminInput name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. SSC Math Olympiad 2025" />
                </AdminField>

                <AdminField label="Slug" error={fieldErrors.slug?.[0]} hint="Auto-generated from the title">
                  <AdminInput
                    name="slug"
                    value={form.slug}
                    readOnly
                    disabled
                    placeholder="auto-generated-from-title"
                  />
                </AdminField>

                <AdminField label="Code" error={fieldErrors.code?.[0]} hint="Short identifier for reports">
                  <AdminInput name="code" value={form.code} onChange={handleFormChange} placeholder="EXAM" />
                </AdminField>

                <AdminField label="Description" error={fieldErrors.description?.[0]} className="sm:col-span-2">
                  <AdminTextarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Brief description of this exam..." />
                </AdminField>

                <AdminField label="Banner Image" error={fieldErrors.bannerUrl?.[0]} className="sm:col-span-2">
                  <AdminImageUpload
                    label="Exam Banner"
                    value={form.bannerUrl}
                    onChange={(url) => setForm((p) => ({ ...p, bannerUrl: url }))}
                    purpose="exam-banner"
                    aspect="cover"
                  />
                </AdminField>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pricing &amp; duration
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AdminField label="Price (৳)" error={fieldErrors.price?.[0]} hint="Set to 0 for a free exam">
                  <AdminInput type="number" name="price" value={form.price} onChange={handleFormChange} min={0} placeholder="0 for free" />
                </AdminField>

                <AdminField label="Original Price (৳)" error={fieldErrors.originalPrice?.[0]} hint="Optional strikethrough price">
                  <AdminInput type="number" name="originalPrice" value={form.originalPrice} onChange={handleFormChange} min={0} placeholder="Optional" />
                </AdminField>

                <AdminField label="Duration (minutes)" error={fieldErrors.durationMinutes?.[0]}>
                  <AdminInput type="number" name="durationMinutes" value={form.durationMinutes} onChange={handleFormChange} min={1} />
                </AdminField>

                <AdminField label="Total Marks" error={fieldErrors.totalMarks?.[0]}>
                  <AdminInput type="number" name="totalMarks" value={form.totalMarks} onChange={handleFormChange} min={1} />
                </AdminField>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Scoring &amp; status
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AdminField label="Negative Marking" error={fieldErrors.negativeMarking?.[0]} hint="0 = no penalty per wrong answer">
                  <AdminInput type="number" name="negativeMarking" value={form.negativeMarking} onChange={handleFormChange} min={0} max={1} step={0.25} placeholder="0 = none" />
                </AdminField>

                <AdminField label="Status" error={fieldErrors.status?.[0]}>
                  <AdminSelect name="status" value={form.status} onChange={handleFormChange}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </AdminSelect>
                </AdminField>
              </div>
            </section>
            </div>

              <DialogFooter className="border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                <AdminButton
                  type="button"
                  variant="ghost"
                  onClick={closeExamDialog}
                  disabled={saving}
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  type="button"
                  onClick={() => void handleSave()}
                  isLoading={saving}
                >
                  {editingExam ? "Update Exam" : "Create Exam"}
                </AdminButton>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Delete confirmation */}
      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete Exam"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This will permanently delete all questions and attempt history.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
        onConfirm={() => handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
