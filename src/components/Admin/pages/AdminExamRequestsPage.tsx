"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import ExamRequestReviewDialog, {
  type ExamRequestDetail,
} from "@/components/Admin/ExamRequestReviewDialog";
import {
  AdminBadge,
  AdminButton,
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

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

const statusVariant: Record<RequestStatus, "warning" | "success" | "danger" | "muted"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "muted",
};

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 1,
};

export default function AdminExamRequestsPage() {
  const { showToast, ToastViewport } = useAdminToast();
  const shouldReduceMotion = useReducedMotion();
  const requestId = useSearchParams().get("id") ?? "";
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [requests, setRequests] = useState<ExamRequestDetail[]>([]);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(emptyPagination);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState<ExamRequestDetail | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  async function loadRequests(q: string, st: string, pg: number, id: string) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pg), limit: "15" });
    if (id) {
      params.set("id", id);
    } else {
      if (q) params.set("search", q);
      if (st) params.set("status", st);
    }
    const result = await adminFetch<{ requests: ExamRequestDetail[]; pagination: AdminPaginationMeta }>(
      `/api/admin/exams/enrollment-requests?${params}`,
    );
    if (result.success && result.data) {
      setRequests(result.data.requests);
      setPagination(result.data.pagination);
      if (id && result.data.requests[0]) {
        setSelectedRequest(result.data.requests[0]);
        setReviewNote(result.data.requests[0].reviewNote ?? "");
      }
    } else {
      setRequests([]);
      setPagination(emptyPagination);
      showToast(result.message ?? "Could not load exam access requests.", true);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => loadRequests(search, statusFilter, page, requestId),
      300,
    );
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, statusFilter, page, requestId]);

  function closeReviewDialog() {
    setSelectedRequest(null);
    setReviewNote("");
  }

  async function handleReview(action: "APPROVE" | "REJECT") {
    if (!selectedRequest) return;
    if (action === "REJECT" && !reviewNote.trim()) {
      showToast("A reason is required to reject a request.", true);
      return;
    }
    setReviewing(true);
    const result = await adminFetch(`/api/admin/exams/enrollment-requests/${selectedRequest.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action, reviewNote: reviewNote.trim() || undefined }),
    });
    if (result.success) {
      showToast(
        action === "APPROVE" ? "Payment approved! Student now has access." : "Request rejected.",
        action !== "APPROVE",
      );
      closeReviewDialog();
      loadRequests(search, statusFilter, page, requestId);
    } else {
      showToast(result.message ?? "Review failed.", true);
    }
    setReviewing(false);
  }

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Exam Access Requests"
        description="Review and approve bKash payment proofs for paid exams"
      />

      <AdminCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <AdminInput
              placeholder="Search by name, email, transaction ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <AdminSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </AdminSelect>
        </div>
      </AdminCard>

      {loading ? (
        <AdminLoading />
      ) : requests.length === 0 ? (
        <AdminEmpty
          title={requestId ? "Request not found" : "No requests found"}
          description={
            requestId
              ? "This payment request may have been removed or the link is no longer valid."
              : "New bKash payment proofs will appear here."
          }
        />
      ) : (
        <motion.div
          className="space-y-3"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="show"
        >
          {requests.map((req) => (
            <motion.div key={req.id} variants={fadeUp}>
              <AdminCard
                className={`p-4 ${req.id === requestId ? "ring-2 ring-accent/25" : ""}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-navy">{req.user.fullName}</span>
                      <AdminBadge variant={statusVariant[req.status]}>{req.status}</AdminBadge>
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs font-medium text-slate-500">
                      <div>
                        {req.exam.title} — ৳{req.paidAmount.toLocaleString("en-US")}
                      </div>
                      <div>
                        {req.user.email} · TxID:{" "}
                        <span className="font-mono font-bold text-indigo-600">
                          {req.bkashTransactionId}
                        </span>
                      </div>
                      <div>Submitted {formatAdminDate(req.submittedAt)}</div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <AdminButton
                      variant={req.status === "PENDING" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(req);
                        setReviewNote(req.reviewNote ?? "");
                      }}
                    >
                      {req.status === "PENDING" ? "Review" : "View"}
                    </AdminButton>
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AdminPagination pagination={pagination} onPageChange={setPage} />

      <ExamRequestReviewDialog
        request={selectedRequest}
        reviewNote={reviewNote}
        reviewing={reviewing}
        onReviewNoteChange={setReviewNote}
        onClose={closeReviewDialog}
        onApprove={() => void handleReview("APPROVE")}
        onReject={() => void handleReview("REJECT")}
      />

      {ToastViewport}
    </div>
  );
}
