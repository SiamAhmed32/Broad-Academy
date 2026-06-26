"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ExternalLink,
  Mail,
  Phone,
  Receipt,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  AdminBadge,
  AdminButton,
  AdminConfirmDialog,
} from "@/components/Admin";
import { formatAdminDate } from "@/lib/admin/client";
import {
  enrollmentRequestStatusLabel,
  isEnrollmentRequestOpen,
  type EnrollmentRequestStatus,
} from "@/lib/enrollments/status";

export type EnrollmentRequestDetail = {
  id: string;
  status: EnrollmentRequestStatus;
  studentPhone: string;
  guardianPhone: string;
  bkashSenderNumber: string;
  bkashTransactionId: string;
  paidAmount: number;
  classLevel: number;
  studentNote: string | null;
  reviewNote: string | null;
  submittedAt: string;
  user: { id: string; fullName: string; email: string; phone: string | null };
  course: { id: string; title: string; price: number };
  reviewedBy: { fullName: string } | null;
};

const requestStatusVariant = {
  PENDING: "warning" as const,
  REVIEWING: "info" as const,
  APPROVED: "success" as const,
  REJECTED: "danger" as const,
  CANCELLED: "danger" as const,
};

type EnrollmentRequestDetailModalProps = {
  request: EnrollmentRequestDetail | null;
  reviewing: boolean;
  onClose: () => void;
  onReview: (
    request: EnrollmentRequestDetail,
    action: "REVIEWING" | "APPROVE" | "REJECT",
    reviewNote: string | null,
  ) => void;
};

type PendingAction = "APPROVE" | "REJECT" | null;

export default function EnrollmentRequestDetailModal({
  request,
  reviewing,
  onClose,
  onReview,
}: EnrollmentRequestDetailModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    if (!request) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pendingAction) onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [request, onClose, pendingAction]);

  return (
    <AnimatePresence>
      {request ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end justify-center bg-navy/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="enrollment-request-title"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[1.75rem] bg-white shadow-2xl sm:rounded-[1.75rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                  Payment verification
                </p>
                <h2
                  id="enrollment-request-title"
                  className="mt-1 text-xl font-semibold text-navy"
                >
                  {request.user.fullName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{request.course.title}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-navy"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <AdminBadge variant={requestStatusVariant[request.status]}>
                  {enrollmentRequestStatusLabel[request.status]}
                </AdminBadge>
                <span className="text-xs text-slate-500">
                  Submitted {formatAdminDate(request.submittedAt)}
                </span>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                  <UserRound className="h-4 w-4 text-accent" />
                  Student details
                </h3>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DetailItem label="Full name" value={request.user.fullName} />
                  <DetailItem label="Email" value={request.user.email} icon={<Mail className="h-3.5 w-3.5" />} />
                  <DetailItem label="Student phone" value={request.studentPhone} icon={<Phone className="h-3.5 w-3.5" />} />
                  <DetailItem label="Class" value={`Class ${request.classLevel}`} />
                  <DetailItem label="Guardian phone" value={request.guardianPhone} icon={<Phone className="h-3.5 w-3.5" />} />
                  {request.user.phone ? (
                    <DetailItem label="Profile phone" value={request.user.phone} />
                  ) : null}
                </dl>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                  <Receipt className="h-4 w-4 text-btnBg" />
                  bKash payment
                </h3>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DetailItem label="Sender number" value={request.bkashSenderNumber} />
                  <DetailItem
                    label="Transaction ID"
                    value={request.bkashTransactionId}
                    mono
                  />
                  <DetailItem
                    label="Expected amount"
                    value={`৳${request.course.price.toLocaleString()}`}
                  />
                  <DetailItem
                    label="Submitted amount"
                    value={`৳${request.paidAmount.toLocaleString()}`}
                  />
                </dl>
                <a
                  href={`/api/admin/enrollment-requests/${request.id}/proof`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-btnBg/10 px-4 py-2.5 text-sm font-semibold text-btnBg transition hover:bg-btnBg/15"
                >
                  View payment screenshot
                  <ExternalLink className="h-4 w-4" />
                </a>
              </section>

              {request.studentNote ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <h3 className="text-sm font-semibold text-amber-900">Student note</h3>
                  <p className="mt-2 text-sm leading-6 text-amber-950/80">
                    {request.studentNote}
                  </p>
                </section>
              ) : null}

              {request.status === "REVIEWING" && request.reviewedBy ? (
                <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                  <h3 className="text-sm font-semibold text-blue-950">
                    Review in progress
                  </h3>
                  <p className="mt-1 text-sm text-blue-800">
                    {request.reviewedBy.fullName} is checking this payment.
                  </p>
                </section>
              ) : null}

              {request.reviewNote ? (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-navy">Review note</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{request.reviewNote}</p>
                  {request.reviewedBy ? (
                    <p className="mt-2 text-xs text-slate-400">
                      Reviewed by {request.reviewedBy.fullName}
                    </p>
                  ) : null}
                </section>
              ) : null}

              {isEnrollmentRequestOpen(request.status) ? (
                <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:flex-wrap">
                  {request.status === "PENDING" ? (
                    <AdminButton
                      variant="ghost"
                      isLoading={reviewing}
                      onClick={() => onReview(request, "REVIEWING", null)}
                      title="Record that you are checking this payment without granting course access"
                    >
                      Start review
                    </AdminButton>
                  ) : null}
                  <AdminButton
                    isLoading={reviewing}
                    onClick={() => setPendingAction("APPROVE")}
                  >
                    Approve & activate
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    isLoading={reviewing}
                    onClick={() => setPendingAction("REJECT")}
                  >
                    Reject
                  </AdminButton>
                </div>
              ) : null}

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <AdminButton variant="ghost" onClick={onClose}>
                  Close
                </AdminButton>
              </div>
            </div>
          </motion.div>

          <AdminConfirmDialog
            open={pendingAction === "APPROVE"}
            title="Approve payment?"
            description={`Activate ${request.course.title} for ${request.user.fullName}. The student will receive course access immediately.`}
            confirmLabel="Approve & activate"
            cancelLabel="Go back"
            variant="success"
            isLoading={reviewing}
            note={{
              label: "Internal note (optional)",
              placeholder: "Optional note for the audit trail...",
              hint: "Not shown to the student unless you include it in a separate message.",
            }}
            onCancel={() => setPendingAction(null)}
            onConfirm={(note) => {
              onReview(request, "APPROVE", note || null);
              setPendingAction(null);
            }}
          />

          <AdminConfirmDialog
            open={pendingAction === "REJECT"}
            title="Reject this payment proof?"
            description={`${request.user.fullName} will be notified and can submit corrected proof from the course page.`}
            confirmLabel="Reject request"
            cancelLabel="Go back"
            variant="danger"
            isLoading={reviewing}
            note={{
              label: "Reason for rejection",
              placeholder: "Explain what needs to be corrected...",
              hint: "This message is shown to the student.",
              required: true,
            }}
            onCancel={() => setPendingAction(null)}
            onConfirm={(note) => {
              onReview(request, "REJECT", note);
              setPendingAction(null);
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd
        className={`mt-1 flex items-center gap-1.5 text-sm font-medium text-navy ${mono ? "font-mono tracking-wide" : ""}`}
      >
        {icon}
        {value}
      </dd>
    </div>
  );
}
