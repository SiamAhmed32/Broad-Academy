"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Archive, Pencil, Plus, RotateCcw, Search, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
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
} from "@/components/Admin";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";

type TestimonialStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type Testimonial = {
  id: string;
  fullName: string;
  identity: string;
  review: string;
  imageUrl: string;
  rating: number;
  featured: boolean;
  displayOrder: number;
  status: TestimonialStatus;
  createdAt: string;
  updatedAt: string;
};

type TestimonialsResponse = {
  testimonials: Testimonial[];
  counts: Record<TestimonialStatus, number>;
  pagination: AdminPaginationMeta;
};

type TestimonialForm = {
  fullName: string;
  identity: string;
  review: string;
  imageUrl: string;
  rating: number;
  featured: boolean;
  displayOrder: number;
  status: TestimonialStatus;
};

const emptyForm: TestimonialForm = {
  fullName: "",
  identity: "",
  review: "",
  imageUrl: "",
  rating: 5,
  featured: false,
  displayOrder: 0,
  status: "DRAFT",
};

const statusVariant: Record<TestimonialStatus, "muted" | "success" | "warning"> = {
  DRAFT: "muted",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

export default function AdminTestimonialsPage() {
  const shouldReduceMotion = useReducedMotion();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [counts, setCounts] = useState<Record<TestimonialStatus, number>>({
    DRAFT: 0,
    PUBLISHED: 0,
    ARCHIVED: 0,
  });
  const [pagination, setPagination] = useState<AdminPaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TestimonialForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [featured, setFeatured] = useState("all");
  const [sort, setSort] = useState("order");
  const [page, setPage] = useState(1);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      status,
      featured,
      sort,
    });
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [featured, page, search, sort, status]);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<TestimonialsResponse>(
      `/api/admin/testimonials?${queryString}`,
    );
    if (res.success && res.data) {
      setTestimonials(res.data.testimonials);
      setCounts(res.data.counts);
      setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [queryString]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTestimonials();
    }, 220);
    return () => window.clearTimeout(timer);
  }, [loadTestimonials]);

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(testimonial: Testimonial) {
    setEditingId(testimonial.id);
    setForm({
      fullName: testimonial.fullName,
      identity: testimonial.identity,
      review: testimonial.review,
      imageUrl: testimonial.imageUrl,
      rating: testimonial.rating,
      featured: testimonial.featured,
      displayOrder: testimonial.displayOrder,
      status: testimonial.status,
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (uploading) return;
    setSaving(true);
    const res = editingId
      ? await adminFetch(`/api/admin/testimonials/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        })
      : await adminFetch("/api/admin/testimonials", {
          method: "POST",
          body: JSON.stringify(form),
        });
    setSaving(false);
    if (res.success) {
      resetForm();
      await loadTestimonials();
    } else {
      alert(res.message || "Could not save testimonial.");
    }
  }

  async function archiveTestimonial(testimonial: Testimonial) {
    const action = testimonial.status === "ARCHIVED" ? "restore" : "archive";
    const ok = window.confirm(
      action === "archive"
        ? "Archive this testimonial? It will stop showing on the website."
        : "Restore this testimonial as a draft?",
    );
    if (!ok) return;

    const res =
      action === "archive"
        ? await adminFetch(`/api/admin/testimonials/${testimonial.id}`, {
            method: "DELETE",
          })
        : await adminFetch(`/api/admin/testimonials/${testimonial.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "DRAFT" }),
          });

    if (!res.success) alert(res.message || "Could not update testimonial.");
    await loadTestimonials();
  }

  const hasFilters = Boolean(search.trim() || status !== "ALL" || featured !== "all");

  return (
    <div>
      <AdminPageHeader
        title="Testimonials"
        description="Manage student and guardian reviews shown on the website."
        actions={
          <AdminButton onClick={openNewForm}>
            <Plus className="h-4 w-4" />
            Add testimonial
          </AdminButton>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Published" value={counts.PUBLISHED} tone="emerald" />
        <StatCard label="Draft" value={counts.DRAFT} tone="slate" />
        <StatCard label="Archived" value={counts.ARCHIVED} tone="amber" />
      </div>

      {showForm ? (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AdminCard className="mb-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-navy">
                {editingId ? "Edit testimonial" : "New testimonial"}
              </h2>
              <p className="text-sm text-slate-500">
                Published testimonials appear in the homepage testimonial carousel.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[280px_1fr]">
              <AdminImageUpload
                label="Reviewer photo"
                value={form.imageUrl}
                onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))}
                purpose="testimonial-avatar"
                aspect="square"
                required
                onUploadingChange={setUploading}
              />
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label="Full name">
                    <AdminInput
                      required
                      value={form.fullName}
                      onChange={(event) =>
                        setForm({ ...form, fullName: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField label="Identity">
                    <AdminInput
                      required
                      placeholder="Parent of Class 8 Student"
                      value={form.identity}
                      onChange={(event) =>
                        setForm({ ...form, identity: event.target.value })
                      }
                    />
                  </AdminField>
                </div>
                <AdminField label="Review">
                  <AdminTextarea
                    required
                    rows={5}
                    value={form.review}
                    onChange={(event) => setForm({ ...form, review: event.target.value })}
                  />
                </AdminField>
                <div className="grid gap-4 sm:grid-cols-4">
                  <AdminField label="Rating">
                    <AdminSelect
                      value={String(form.rating)}
                      onChange={(event) =>
                        setForm({ ...form, rating: Number(event.target.value) })
                      }
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} star
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Status">
                    <AdminSelect
                      value={form.status}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status: event.target.value as TestimonialStatus,
                        })
                      }
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Display order">
                    <AdminInput
                      type="number"
                      min={0}
                      value={form.displayOrder}
                      onChange={(event) =>
                        setForm({ ...form, displayOrder: Number(event.target.value) })
                      }
                    />
                  </AdminField>
                  <AdminField label="Featured">
                    <AdminSelect
                      value={form.featured ? "true" : "false"}
                      onChange={(event) =>
                        setForm({ ...form, featured: event.target.value === "true" })
                      }
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </AdminSelect>
                  </AdminField>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AdminButton type="submit" isLoading={saving || uploading}>
                    {editingId ? "Save changes" : "Create testimonial"}
                  </AdminButton>
                  <AdminButton type="button" variant="ghost" onClick={resetForm}>
                    Cancel
                  </AdminButton>
                </div>
              </div>
            </form>
          </AdminCard>
        </motion.div>
      ) : null}

      <AdminCard className="mb-5">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search testimonials..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-navy outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </label>
          <AdminSelect
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </AdminSelect>
          <AdminSelect
            value={featured}
            onChange={(event) => {
              setFeatured(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="true">Featured</option>
            <option value="false">Not featured</option>
          </AdminSelect>
          <AdminSelect
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="order">Display order</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name-asc">Name A-Z</option>
            <option value="rating">Top rated</option>
          </AdminSelect>
        </div>
      </AdminCard>

      {loading ? (
        <AdminLoading label="Loading testimonials..." />
      ) : testimonials.length === 0 ? (
        <AdminEmpty
          title={hasFilters ? "No testimonials match your filters" : "No testimonials yet"}
          description={
            hasFilters
              ? "Try changing the search or filters."
              : "Add your first student or guardian review."
          }
          actionLabel={hasFilters ? "Clear filters" : "Add testimonial"}
          onAction={() => {
            if (hasFilters) {
              setSearch("");
              setStatus("ALL");
              setFeatured("all");
              setSort("order");
              setPage(1);
            } else {
              openNewForm();
            }
          }}
        />
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3 font-semibold text-navy">Reviewer</th>
                  <th className="px-5 py-3 font-semibold text-navy">Review</th>
                  <th className="px-5 py-3 font-semibold text-navy">Rating</th>
                  <th className="px-5 py-3 font-semibold text-navy">Status</th>
                  <th className="px-5 py-3 font-semibold text-navy">Created</th>
                  <th className="px-5 py-3 font-semibold text-navy">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((testimonial, index) => (
                  <motion.tr
                    key={testimonial.id}
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.025 }}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={testimonial.imageUrl}
                          alt=""
                          className="h-11 w-11 rounded-2xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2 font-semibold text-navy">
                            {testimonial.fullName}
                            {testimonial.featured ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                <Star className="h-3 w-3 fill-amber-500" />
                                Featured
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {testimonial.identity}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-md px-5 py-4 text-slate-600">
                      <p className="line-clamp-2">{testimonial.review}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {testimonial.rating}/5
                    </td>
                    <td className="px-5 py-4">
                      <AdminBadge variant={statusVariant[testimonial.status]}>
                        {testimonial.status.charAt(0) +
                          testimonial.status.slice(1).toLowerCase()}
                      </AdminBadge>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatAdminDate(testimonial.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(testimonial)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void archiveTestimonial(testimonial)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-red-600"
                        >
                          {testimonial.status === "ARCHIVED" ? (
                            <RotateCcw className="h-3.5 w-3.5" />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                          {testimonial.status === "ARCHIVED" ? "Restore" : "Archive"}
                        </button>
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
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "slate" | "amber";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <div className={`rounded-2xl px-5 py-4 ring-1 ${tones[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.22em]">{label}</p>
      <p className="mt-2 text-2xl font-black">{value.toLocaleString()}</p>
    </div>
  );
}
