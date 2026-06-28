"use client";

import { ExternalLink, ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";

import { AdminBadge } from "@/components/Admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAdminDate } from "@/lib/admin/client";
import { cn } from "@/lib/utils";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type ExamRequestDetail = {
  id: string;
  status: RequestStatus;
  studentPhone: string | null;
  guardianPhone: string | null;
  bkashSenderNumber: string;
  bkashTransactionId: string;
  paidAmount: number;
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

function DetailCell({
  label,
  value,
  mono = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-navy/8 bg-[#fafcfe] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/45">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold text-navy",
          mono && "font-mono tracking-wide",
          accent && "text-accent",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PaymentProofImage({ requestId }: { requestId: string }) {
  const proofUrl = `/api/admin/exams/enrollment-requests/${requestId}/proof`;
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-navy/8 bg-heroBg/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-navy">Payment screenshot</p>
          <p className="text-xs text-navy/45">Verify amount, number, and transaction ID</p>
        </div>
        <a
          href={proofUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-accent/30 hover:text-accent"
        >
          Open full size
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="relative flex min-h-[220px] items-center justify-center bg-slate-100 p-4">
        {loading && !failed ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : null}

        {failed ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <ImageIcon className="h-10 w-10 text-navy/25" />
            <p className="text-sm font-semibold text-navy">Could not load screenshot</p>
            <p className="text-xs text-navy/45">
              Use &quot;Open full size&quot; or try again in a moment.
            </p>
            <a
              href={proofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 text-xs font-semibold text-accent hover:underline"
            >
              View payment proof
            </a>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proofUrl}
            alt="bKash payment proof"
            className={cn(
              "max-h-[420px] w-full rounded-xl object-contain shadow-sm transition-opacity",
              loading ? "opacity-0" : "opacity-100",
            )}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        )}
      </div>
    </section>
  );
}

type ExamRequestReviewDialogProps = {
  request: ExamRequestDetail | null;
  reviewNote: string;
  reviewing: boolean;
  onReviewNoteChange: (value: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
};

export default function ExamRequestReviewDialog({
  request,
  reviewNote,
  reviewing,
  onReviewNoteChange,
  onClose,
  onApprove,
  onReject,
}: ExamRequestReviewDialogProps) {
  const open = Boolean(request);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !reviewing) onClose();
      }}
    >
      {request ? (
        <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh]">
          <DialogHeader className="space-y-3 border-b border-navy/8 px-6 py-5 pr-14">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Exam payment</Badge>
              <AdminBadge variant={statusVariant[request.status]}>
                {request.status}
              </AdminBadge>
            </div>
            <DialogTitle className="text-xl sm:text-2xl">{request.user.fullName}</DialogTitle>
            <DialogDescription className="text-sm text-navy/55">
              {request.exam.title} · Submitted {formatAdminDate(request.submittedAt)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailCell label="Student email" value={request.user.email} />
              <DetailCell
                label="Exam fee"
                value={`৳${request.paidAmount.toLocaleString("en-US")}`}
                accent
              />
              <DetailCell
                label="bKash sender"
                value={request.bkashSenderNumber}
                mono
              />
              <DetailCell
                label="Transaction ID"
                value={request.bkashTransactionId}
                mono
              />
              {request.studentPhone ? (
                <DetailCell label="Student phone" value={request.studentPhone} mono />
              ) : null}
              {request.guardianPhone ? (
                <DetailCell label="Guardian phone" value={request.guardianPhone} mono />
              ) : null}
              {request.classLevel ? (
                <DetailCell label="Class" value={`Class ${request.classLevel}`} />
              ) : null}
            </div>

            <PaymentProofImage requestId={request.id} />

            {request.studentNote ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Student note
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-950/85">
                  {request.studentNote}
                </p>
              </section>
            ) : null}

            {request.status === "PENDING" ? (
              <div className="space-y-2">
                <label
                  htmlFor="exam-review-note"
                  className="text-sm font-semibold text-navy"
                >
                  Review note
                  <span className="ml-1 font-normal text-navy/45">
                    (required if rejecting)
                  </span>
                </label>
                <textarea
                  id="exam-review-note"
                  value={reviewNote}
                  onChange={(e) => onReviewNoteChange(e.target.value)}
                  rows={4}
                  disabled={reviewing}
                  placeholder="Optional note for approval. Required if you reject this payment."
                  className="min-h-[100px] w-full resize-none rounded-xl border border-navy/10 bg-heroBg px-3.5 py-3 text-sm text-navy outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                />
              </div>
            ) : (
              <section className="rounded-2xl border border-navy/8 bg-[#fafcfe] px-4 py-3">
                {request.reviewNote ? (
                  <p className="text-sm leading-6 text-navy/70">{request.reviewNote}</p>
                ) : (
                  <p className="text-sm text-navy/45">No review note recorded.</p>
                )}
                {request.reviewedBy ? (
                  <p className="mt-2 text-xs text-navy/45">
                    Reviewed by {request.reviewedBy.fullName}
                    {request.reviewedAt
                      ? ` · ${formatAdminDate(request.reviewedAt)}`
                      : ""}
                  </p>
                ) : null}
              </section>
            )}
          </div>

          {request.status === "PENDING" ? (
            <DialogFooter className="gap-2 border-t border-navy/8 bg-white px-6 py-4 sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={onReject}
                disabled={reviewing}
              >
                Reject
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={onApprove}
                disabled={reviewing}
              >
                {reviewing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {reviewing ? "Processing..." : "Approve access"}
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter className="border-t border-navy/8 px-6 py-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
