"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Search,
} from "lucide-react";

import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminSelect,
  type AdminPaginationMeta,
  useAdminToast,
} from "@/components/Admin";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";

type DocumentStatus = "PENDING" | "REVIEWED" | "APPROVED" | "REJECTED";

type Document = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  documentType: string;
  fileUrl: string;
  fileName: string | null;
  fileFormat: string | null;
  message: string | null;
  status: DocumentStatus;
  createdAt: string;
};

type CountSummary = {
  ALL: number;
  PENDING: number;
  REVIEWED: number;
  APPROVED: number;
  REJECTED: number;
};

const statusVariant: Record<DocumentStatus, "warning" | "info" | "success" | "danger"> = {
  PENDING: "warning",
  REVIEWED: "info",
  APPROVED: "success",
  REJECTED: "danger",
};

const statusOptions = [
  { value: "", label: "All Statuses", key: "ALL" },
  { value: "PENDING", label: "Pending", key: "PENDING" },
  { value: "REVIEWED", label: "Reviewed", key: "REVIEWED" },
  { value: "APPROVED", label: "Approved", key: "APPROVED" },
  { value: "REJECTED", label: "Rejected", key: "REJECTED" },
] as const;

const documentStatusOptions: Array<{ value: DocumentStatus; label: string }> = [
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 1,
};

export default function AdminDocumentsPage() {
  const shouldReduceMotion = useReducedMotion();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showToast, ToastViewport } = useAdminToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(emptyPagination);
  const [counts, setCounts] = useState<CountSummary>({
    ALL: 0,
    PENDING: 0,
    REVIEWED: 0,
    APPROVED: 0,
    REJECTED: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const loadDocuments = useCallback(async (q: string, st: string, pg: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pg), limit: "15" });
    if (q) params.set("search", q);
    if (st) params.set("status", st);

    const res = await adminFetch<{
      documents: Document[];
      pagination: AdminPaginationMeta;
      counts: CountSummary;
    }>(`/api/admin/documents?${params}`);

    if (res.success && res.data) {
      setDocuments(res.data.documents);
      setPagination(res.data.pagination);
      setCounts(res.data.counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadDocuments(search, statusFilter, page), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, statusFilter, page, loadDocuments]);

  const handleStatusChange = async (doc: Document, nextStatus: DocumentStatus) => {
    if (doc.status === nextStatus || updatingStatusId) return;

    const previousDocuments = documents;
    setUpdatingStatusId(doc.id);
    setDocuments((current) =>
      current.map((item) =>
        item.id === doc.id ? { ...item, status: nextStatus } : item,
      ),
    );

    const res = await adminFetch("/api/admin/documents", {
      method: "PATCH",
      body: JSON.stringify({
        id: doc.id,
        status: nextStatus,
      }),
    });

    if (res.success) {
      showToast("Document status updated.");
      await loadDocuments(search, statusFilter, page);
    } else {
      setDocuments(previousDocuments);
      showToast(res.message ?? "Could not update document status.", true);
    }

    setUpdatingStatusId(null);
  };

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Document Submissions"
        description="Verify files and documentation submitted by students or parents for consent, registration, or evaluation."
      />

      {/* Tabs list with Count Badges */}
      <div className="flex flex-wrap border-b border-slate-200">
        {statusOptions.map((opt) => {
          const isActive = statusFilter === opt.value;
          const count = counts[opt.key];
          return (
            <button
              key={opt.key}
              onClick={() => {
                setStatusFilter(opt.value);
                setPage(1);
              }}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-slate-500 hover:text-navy"
              }`}
            >
              {opt.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive ? "bg-accent/15 text-accent" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <AdminCard className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <AdminInput
            placeholder="Search by student name, email, phone, or document type..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </AdminCard>

      {/* Main Grid/List View */}
      {loading ? (
        <AdminLoading label="Loading document submissions..." />
      ) : documents.length === 0 ? (
        <AdminEmpty
          title="No document submissions found"
          description="Try modifying your search or filter status to find matching documents."
        />
      ) : (
        <motion.div
          className="space-y-3"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          initial="hidden"
          animate="show"
        >
          {documents.map((doc) => (
            <motion.div key={doc.id} variants={fadeUp}>
              <AdminCard className="p-4 hover:border-slate-300 transition-all">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy text-base">{doc.documentType}</span>
                      <AdminBadge variant={statusVariant[doc.status]}>
                        {doc.status.charAt(0) + doc.status.slice(1).toLowerCase()}
                      </AdminBadge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 font-medium">
                      {doc.fullName} · <span className="text-slate-400 font-mono text-xs">{doc.email}</span>
                      {doc.phone ? ` · ${doc.phone}` : ""}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <span>Submitted {formatAdminDate(doc.createdAt)}</span>
                      {doc.fileName && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[200px]" title={doc.fileName}>
                            {doc.fileName}
                          </span>
                        </>
                      )}
                    </div>
                    {doc.message && (
                      <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 line-clamp-1 border border-slate-100 max-w-2xl">
                        &quot;{doc.message}&quot;
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0 sm:justify-end">
                    <AdminSelect
                      value={doc.status}
                      onChange={(e) =>
                        void handleStatusChange(doc, e.target.value as DocumentStatus)
                      }
                      disabled={updatingStatusId === doc.id}
                      aria-label={`Change status for ${doc.documentType}`}
                      className="h-9 w-[150px] rounded-xl px-3 text-sm font-semibold"
                    >
                      {documentStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </AdminSelect>
                    <a
                      href={`/api/admin/documents/${doc.id}/file?download=1`}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-navy transition hover:bg-slate-50"
                      title="Download file"
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      <AdminPagination pagination={pagination} onPageChange={setPage} />
      {ToastViewport}
    </div>
  );
}
