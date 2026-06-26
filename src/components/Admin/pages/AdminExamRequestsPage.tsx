"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Search,
  X,
} from "lucide-react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminField,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminSelect,
  AdminTextarea,
  type AdminPaginationMeta,
  useAdminToast,
} from "@/components/Admin";
import Modal from "@/components/reusables/Modal";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type ExamRequest = {
  id: string;
  status: RequestStatus;
  studentPhone: string | null;
  guardianPhone: string | null;
  bkashSenderNumber: string;
  bkashTransactionId: string;
  paidAmount: number;
  paymentProofPublicId: string;
  paymentProofFormat: string;
  classLevel: number | null;
  studentNote: string | null;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  user: { id: string; fullName: string; email: string; phone: string | null };
  exam: { id: string; title: string; slug: string; price: number };
  reviewedBy: { fullName: string } | null;
};

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

function getCloudinaryProofUrl(publicId: string, format: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "demo";
  return `https://res.cloudinary.com/${cloud}/image/upload/w_800/${publicId}.${format}`;
}

export default function AdminExamRequestsPage() {
  const { showToast, ToastViewport } = useAdminToast();
  const shouldReduceMotion = useReducedMotion();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(emptyPagination);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState<ExamRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  async function loadRequests(q: string, st: string, pg: number) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pg), limit: "15" });
    if (q) params.set("search", q);
    if (st) params.set("status", st);
    const result = await adminFetch<{ requests: ExamRequest[]; pagination: AdminPaginationMeta }>(
      `/api/admin/exams/enrollment-requests?${params}`,
    );
    if (result.success && result.data) {
      setRequests(result.data.requests);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadRequests(search, statusFilter, page), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, statusFilter, page]);

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
      setSelectedRequest(null);
      setReviewNote("");
      loadRequests(search, statusFilter, page);
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

      {/* Filters */}
      <AdminCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <AdminInput
              placeholder="Search by name, email, transaction ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <AdminSelect
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
        <AdminEmpty title="No requests found" />
      ) : (
        <motion.div
          className="space-y-3"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="show"
        >
          {requests.map((req) => (
            <motion.div key={req.id} variants={fadeUp}>
              <AdminCard className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy">{req.user.fullName}</span>
                      <AdminBadge variant={statusVariant[req.status]}>{req.status}</AdminBadge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 space-y-0.5 font-medium">
                      <div>{req.exam.title} — ৳{req.paidAmount}</div>
                      <div>{req.user.email} · TxID: <span className="font-mono text-indigo-600 font-bold">{req.bkashTransactionId}</span></div>
                      <div>Submitted {formatAdminDate(req.submittedAt)}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <AdminButton
                      variant={req.status === "PENDING" ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => { setSelectedRequest(req); setReviewNote(req.reviewNote ?? ""); }}
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

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => { setSelectedRequest(null); setReviewNote(""); }}
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-navy">Payment Review</h2>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="text-slate-400 text-xs mb-1">Student</div>
                <div className="text-navy font-semibold">{selectedRequest.user.fullName}</div>
                <div className="text-slate-500 text-xs">{selectedRequest.user.email}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="text-slate-400 text-xs mb-1">Exam</div>
                <div className="text-navy font-semibold">{selectedRequest.exam.title}</div>
                <div className="text-emerald-600 font-bold">৳{selectedRequest.paidAmount}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="text-slate-400 text-xs mb-1">bKash Number</div>
                <div className="text-navy font-mono font-semibold">{selectedRequest.bkashSenderNumber}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="text-slate-400 text-xs mb-1">Transaction ID</div>
                <div className="text-indigo-600 font-mono font-bold">{selectedRequest.bkashTransactionId}</div>
              </div>
              {selectedRequest.studentPhone && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="text-slate-400 text-xs mb-1">Student Phone</div>
                  <div className="text-navy font-mono">{selectedRequest.studentPhone}</div>
                </div>
              )}
              {selectedRequest.classLevel && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="text-slate-400 text-xs mb-1">Class</div>
                  <div className="text-navy font-semibold">Class {selectedRequest.classLevel}</div>
                </div>
              )}
            </div>

            {/* Payment screenshot */}
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 p-2 bg-slate-50 border-b border-slate-200">Payment Screenshot</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getCloudinaryProofUrl(
                  selectedRequest.paymentProofPublicId,
                  selectedRequest.paymentProofFormat,
                )}
                alt="Payment proof"
                className="max-h-80 w-full object-contain bg-slate-100"
              />
            </div>

            {selectedRequest.studentNote && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100">
                <div className="text-slate-400 text-xs mb-1">Student Note</div>
                <div className="text-navy">{selectedRequest.studentNote}</div>
              </div>
            )}

            {selectedRequest.status === "PENDING" ? (
              <>
                <AdminField label="Review Note (required for rejection)">
                  <AdminTextarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                    placeholder="Optional note to student (required if rejecting)..."
                  />
                </AdminField>
                <div className="flex gap-3 pt-2">
                  <AdminButton
                    variant="ghost"
                    className="flex-1"
                    onClick={() => handleReview("REJECT")}
                    disabled={reviewing}
                  >
                    <X size={16} /> Reject
                  </AdminButton>
                  <AdminButton
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleReview("APPROVE")}
                    disabled={reviewing}
                    isLoading={reviewing}
                  >
                    {!reviewing && <Check size={16} />} Approve Access
                  </AdminButton>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100">
                <AdminBadge variant={statusVariant[selectedRequest.status]}>{selectedRequest.status}</AdminBadge>
                {selectedRequest.reviewNote && (
                  <p className="text-slate-700 mt-2">{selectedRequest.reviewNote}</p>
                )}
                {selectedRequest.reviewedBy && (
                  <p className="text-slate-500 text-xs mt-1 font-medium">
                    Reviewed by {selectedRequest.reviewedBy.fullName}
                    {selectedRequest.reviewedAt && ` on ${formatAdminDate(selectedRequest.reviewedAt)}`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {ToastViewport}
    </div>
  );
}
