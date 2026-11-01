"use client";
import { useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  ImageUp,
  Loader2,
  MessageSquare,
  RotateCw,
  Video,
  XCircle,
} from "lucide-react";
import { PAYMENT_STATUS_LABELS } from "@/lib/counselling/payment";
import { formatSessionDateTime } from "@/lib/counselling/schedule";
import type { CounsellingBookingSummary } from "@/lib/student/types";
import SessionFiles from "./SessionFiles";
import { sessionNextStep } from "./sessionPresentation";
export function BookingDetails({
  booking,
  notify,
  onRefresh,
  paymentConfig,
}: {
  booking: CounsellingBookingSummary;
  notify: (message: string, error?: boolean) => void;
  onRefresh: () => Promise<void>;
  paymentConfig: { bkashNumber: string | null; paymentConfigured: boolean };
}) {
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [proofFileName, setProofFileName] = useState("");

  async function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmittingPayment(true);
    try {
      const response = await fetch(
        `/api/counselling/bookings/${booking.id}/payment`,
        {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message ?? "Payment submission failed.");
      }

      notify("Payment proof submitted. We will verify it shortly.");
      form.reset();
      setProofFileName("");
      await onRefresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Payment submission failed.",
        true,
      );
    } finally {
      setSubmittingPayment(false);
    }
  }

  const [tab, setTab] = useState<"overview" | "payment" | "files">("overview");
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status={booking.status} />
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>
      <div>
        <h2 className="text-xl font-bold text-navy">{booking.fullName}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {booking.educationLevel} · Requested {formatDate(booking.createdAt)}
        </p>
      </div>
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
          What happens next
        </p>
        <p className="mt-1.5 text-sm leading-6 text-navy">
          {sessionNextStep(booking)}
        </p>
        {booking.status === "CONFIRMED" && booking.meetingLink ? (
          <a
            href={booking.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-btnBg px-3 py-2 text-xs font-semibold text-white"
          >
            <Video className="h-4 w-4" />
            Open meeting link
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
      <div
        className="flex gap-1 border-b border-slate-200"
        role="tablist"
        aria-label="Session information"
      >
        {(["overview", "payment", "files"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`session-tab-${value}`}
            aria-controls={`session-panel-${value}`}
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            onKeyDown={(event) => {
              if (
                event.key !== "ArrowLeft" &&
                event.key !== "ArrowRight" &&
                event.key !== "Home" &&
                event.key !== "End"
              )
                return;
              event.preventDefault();
              const tabs = ["overview", "payment", "files"] as const;
              const index = tabs.indexOf(value);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 2
                    : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
              setTab(tabs[next]);
              document.getElementById(`session-tab-${tabs[next]}`)?.focus();
            }}
            tabIndex={tab === value ? 0 : -1}
            className={`border-b-2 px-4 py-3 text-sm font-semibold capitalize ${tab === value ? "border-btnBg text-btnBg" : "border-transparent text-slate-500 hover:text-navy"}`}
          >
            {value}
            {value === "files" ? ` (${booking.files.length})` : ""}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`session-panel-${tab}`}
        aria-labelledby={`session-tab-${tab}`}
      >
        {tab === "overview" ? (
          <div className="space-y-5">
            <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <InfoCell
                icon={CalendarDays}
                label="Session time · Bangladesh"
                value={
                  formatSessionDateTime(booking.scheduledAt) ??
                  "Awaiting schedule"
                }
              />
              <InfoCell
                icon={FileText}
                label="School"
                value={booking.schoolName || "Not provided"}
              />
              <InfoCell
                icon={FileText}
                label="Class / roll"
                value={
                  booking.educationLevel +
                  (booking.classRoll ? ` · Roll ${booking.classRoll}` : "")
                }
              />
              <InfoCell
                icon={Banknote}
                label="Payment"
                value={PAYMENT_STATUS_LABELS[booking.paymentStatus]}
              />
            {booking.studentGroup ? (
              <InfoCell icon={FileText} label="Group" value={booking.studentGroup} />
            ) : null}
            </div>
            {booking.message ? (
              <div>
                <h3 className="text-sm font-semibold">Your request</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                  {booking.message}
                </p>
              </div>
            ) : null}
            {booking.counsellorNotes ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquare className="h-4 w-4" />
                  Counsellor notes
                </h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                  {booking.counsellorNotes}
                </p>
              </div>
            ) : null}
            <p className="text-xs leading-5 text-slate-400">
              Session dates are arranged by our team. Payment receipts and
              shared documents are available in the tabs above.
            </p>
          </div>
        ) : null}
        {tab === "payment" ? (
          <CounsellingPaymentPanel
            booking={booking}
            paymentConfig={paymentConfig}
            submitting={submittingPayment}
            proofFileName={proofFileName}
            onProofChange={setProofFileName}
            onSubmit={handlePaymentSubmit}
          />
        ) : null}
        {tab === "files" ? (
          <SessionFiles
            key={booking.id}
            booking={booking}
            onChanged={onRefresh}
          />
        ) : null}
      </section>
    </div>
  );
}

function CounsellingPaymentPanel({
  booking,
  paymentConfig,
  submitting,
  proofFileName,
  onProofChange,
  onSubmit,
}: {
  booking: CounsellingBookingSummary;
  paymentConfig: { bkashNumber: string | null; paymentConfigured: boolean };
  submitting: boolean;
  proofFileName: string;
  onProofChange: (name: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const paymentTone = {
    UNQUOTED: "bg-slate-50 text-slate-700",
    AWAITING_PAYMENT: "bg-amber-50 text-amber-800",
    PROOF_SUBMITTED: "bg-sky-50 text-sky-800",
    PAID: "bg-emerald-50 text-emerald-800",
    WAIVED: "bg-violet-50 text-violet-800",
  }[booking.paymentStatus];

  return (
    <div className="mt-5 rounded-2xl border border-navy/8 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Banknote className="h-4 w-4 text-btnBg" />
        <p className="text-sm font-semibold text-navy">Session payment</p>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${paymentTone}`}
        >
          {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
        </span>
      </div>

      {booking.sessionFee != null && booking.sessionFee > 0 ? (
        <p className="mt-3 text-2xl font-bold text-navy">
          ৳{booking.sessionFee.toLocaleString("en-US")}
        </p>
      ) : null}

      {booking.paymentStatus === "PAID" ||
      booking.paymentStatus === "WAIVED" ? (
        <p className="mt-3 text-sm text-navy/65">
          {booking.paymentStatus === "PAID"
            ? booking.status === "CONFIRMED"
              ? "Payment verified. Your session is confirmed."
              : booking.status === "COMPLETED"
                ? "Payment verified. This session is complete."
                : "Payment verified. Awaiting session confirmation."
            : "Session fee waived by our team."}
        </p>
      ) : null}

      {booking.paymentStatus === "PROOF_SUBMITTED" ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-sky-800">
          <Clock3 className="h-4 w-4" />
          Payment proof submitted — waiting for verification.
        </p>
      ) : null}

      {booking.paymentStatus === "AWAITING_PAYMENT" ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-[#e2136e]/20 bg-[#fff5fa] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy/45">
                  Send money to
                </p>
                <p className="mt-1 text-sm font-semibold text-navy">
                  {paymentConfig.bkashNumber ?? "Not configured"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy/45">
                  Exact amount
                </p>
                <p className="mt-1 text-sm font-semibold text-navy">
                  ৳{(booking.sessionFee ?? 0).toLocaleString("en-US")}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-navy/60">
              Use bKash Send Money, keep the transaction ID, and upload a clear
              screenshot.
            </p>
          </div>

          {!paymentConfig.paymentConfigured ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Payment is not configured yet. Please contact support.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-navy">
                  bKash sender number
                </span>
                <input
                  name="bkashSenderNumber"
                  required
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                  className="mt-1.5 h-10 w-full rounded-xl border border-navy/10 px-3 text-sm outline-none focus:border-btnBg"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-navy">
                  Transaction ID
                </span>
                <input
                  name="bkashTransactionId"
                  required
                  autoCapitalize="characters"
                  placeholder="BQ12ABC345"
                  className="mt-1.5 h-10 w-full rounded-xl border border-navy/10 px-3 text-sm uppercase outline-none focus:border-btnBg"
                />
              </label>
              <div className="sm:col-span-2">
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy/15 bg-[#f8fafc] px-4 py-5 text-center transition hover:border-btnBg/50">
                  <ImageUp className="h-7 w-7 text-btnBg" />
                  <span className="mt-2 text-sm font-semibold text-navy">
                    {proofFileName || "Choose payment screenshot"}
                  </span>
                  <span className="mt-1 text-xs text-navy/45">
                    JPG, PNG, or WebP · max 5 MB
                  </span>
                  <input
                    type="file"
                    name="paymentProof"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="sr-only"
                    onChange={(event) =>
                      onProofChange(event.target.files?.[0]?.name ?? "")
                    }
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="sm:col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-btnBg px-4 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {submitting ? "Submitting..." : "Submit payment proof"}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}

function InfoCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy/40">
        {label}
      </p>
      <div className="mt-1.5 flex items-center gap-2 text-sm font-medium text-navy">
        <Icon className="h-4 w-4 text-btnBg" />
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  compact,
}: {
  status: string;
  compact?: boolean;
}) {
  const config = {
    PENDING: {
      color: "bg-amber-50 text-amber-700",
      icon: Clock3,
      label: "Pending",
    },
    CONFIRMED: {
      color: "bg-sky-50 text-sky-700",
      icon: CheckCircle2,
      label: "Confirmed",
    },
    COMPLETED: {
      color: "bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
      label: "Completed",
    },
    CANCELLED: {
      color: "bg-slate-100 text-slate-600",
      icon: XCircle,
      label: "Cancelled",
    },
  }[status] || {
    color: "bg-slate-100 text-slate-600",
    icon: AlertCircle,
    label: status,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.1em] ${config.color} ${
        compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[10px]"
      }`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function formatDate(value: string) {
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}
