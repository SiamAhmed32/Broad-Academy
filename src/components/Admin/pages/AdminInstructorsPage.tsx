"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Star } from "lucide-react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminSelect,
  type AdminPaginationMeta,
} from "@/components/Admin";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";

type InstructorStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

type Instructor = {
  id: string;
  slug: string;
  fullName: string;
  title: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  studentsCount: number;
  coursesCount: number;
  featured: boolean;
  status: InstructorStatus;
  displayOrder: number;
  avatarUrl: string;
  createdAt: string;
};

type InstructorsResponse = {
  instructors: Instructor[];
  specialties: string[];
  counts: Record<InstructorStatus, number>;
  pagination: AdminPaginationMeta;
};

const statusVariant: Record<InstructorStatus, "success" | "warning" | "muted"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  DRAFT: "muted",
};

export default function AdminInstructorsPage() {
  const shouldReduceMotion = useReducedMotion();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<InstructorStatus, number>>({
    ACTIVE: 0,
    INACTIVE: 0,
    DRAFT: 0,
  });
  const [pagination, setPagination] = useState<AdminPaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [specialty, setSpecialty] = useState("");
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
    if (specialty) params.set("specialty", specialty);
    return params.toString();
  }, [featured, page, search, sort, specialty, status]);

  const loadInstructors = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<InstructorsResponse>(
      `/api/admin/instructors?${queryString}`,
    );
    if (res.success && res.data) {
      setInstructors(res.data.instructors);
      setSpecialties(res.data.specialties);
      setCounts(res.data.counts);
      setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [queryString]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInstructors();
    }, 220);
    return () => window.clearTimeout(timer);
  }, [loadInstructors]);

  const hasFilters = Boolean(search.trim() || specialty || status !== "ALL" || featured !== "all");

  return (
    <div>
      <AdminPageHeader
        title="Instructors"
        description="Manage mentor profiles shown on the website."
        actions={
          <Link href="/admin/instructors/new">
            <AdminButton>
              <Plus className="h-4 w-4" />
              Add instructor
            </AdminButton>
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Active" value={counts.ACTIVE} tone="emerald" />
        <StatCard label="Draft" value={counts.DRAFT} tone="slate" />
        <StatCard label="Inactive" value={counts.INACTIVE} tone="amber" />
      </div>

      <AdminCard className="mb-5">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_0.85fr_0.85fr_0.75fr_0.85fr]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, subject, expertise..."
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
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
          </AdminSelect>
          <AdminSelect
            value={specialty}
            onChange={(event) => {
              setSpecialty(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All specialties</option>
            {specialties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
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
            <option value="featured">Featured first</option>
            <option value="rating">Top rated</option>
            <option value="students">Most students</option>
            <option value="newest">Newest</option>
            <option value="name-asc">Name A-Z</option>
          </AdminSelect>
        </div>
      </AdminCard>

      {loading ? (
        <AdminLoading label="Loading instructors..." />
      ) : instructors.length === 0 ? (
        <AdminEmpty
          title={hasFilters ? "No instructors match your filters" : "No instructors yet"}
          description={
            hasFilters
              ? "Try clearing search or changing the filters."
              : "Add your first instructor profile."
          }
          actionLabel={hasFilters ? "Clear filters" : "Add instructor"}
          onAction={() => {
            if (hasFilters) {
              setSearch("");
              setStatus("ALL");
              setSpecialty("");
              setFeatured("all");
              setSort("order");
              setPage(1);
            } else {
              window.location.href = "/admin/instructors/new";
            }
          }}
        />
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3 font-semibold text-navy">Instructor</th>
                  <th className="px-5 py-3 font-semibold text-navy">Specialty</th>
                  <th className="px-5 py-3 font-semibold text-navy">Stats</th>
                  <th className="px-5 py-3 font-semibold text-navy">Status</th>
                  <th className="px-5 py-3 font-semibold text-navy">Created</th>
                  <th className="px-5 py-3 font-semibold text-navy">Actions</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((instructor, index) => (
                  <motion.tr
                    key={instructor.id}
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.025 }}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={instructor.avatarUrl}
                          alt=""
                          className="h-11 w-11 rounded-2xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2 font-semibold text-navy">
                            {instructor.fullName}
                            {instructor.featured ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                <Star className="h-3 w-3 fill-amber-500" />
                                Featured
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">{instructor.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{instructor.specialty}</td>
                    <td className="px-5 py-4 text-slate-600">
                      <div>{instructor.rating.toFixed(1)} rating</div>
                      <div className="text-xs text-slate-400">
                        {instructor.studentsCount.toLocaleString()} students ·{" "}
                        {instructor.coursesCount.toLocaleString()} courses
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <AdminBadge variant={statusVariant[instructor.status]}>
                        {instructor.status.charAt(0) + instructor.status.slice(1).toLowerCase()}
                      </AdminBadge>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatAdminDate(instructor.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/instructors/${instructor.slug}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-accent"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                        <Link
                          href={`/admin/instructors/${instructor.slug}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
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
