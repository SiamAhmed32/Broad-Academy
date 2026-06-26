"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  ImageUp,
  LoaderCircle,
  LockKeyhole,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import {
  isEnrollmentRequestOpen,
  type EnrollmentRequestStatus,
} from "@/lib/enrollments/status";

type EnrollmentState = {
  course: { id: string; slug: string; title: string; price: number };
  hasAccess: boolean;
  enrollmentStatus: string | null;
  request: {
    id: string;
    status: EnrollmentRequestStatus;
    submittedAt: string;
    reviewNote: string | null;
  } | null;
  bkashNumber: string | null;
  paymentConfigured: boolean;
  profilePhone: string | null;
  profileClassLevel: number | null;
};

type Fields = Record<string, string[] | undefined>;

export default function EnrollmentCTA({
  courseId,
  courseSlug,
  courseTitle,
  coursePrice,
  compact = false,
}: {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  coursePrice: number;
  compact?: boolean;
}) {
  const [state, setState] = useState<EnrollmentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Fields>({});
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadEnrollmentState() {
      try {
        const response = await fetch(
          `/api/enrollment-requests?courseId=${encodeURIComponent(courseId)}`,
          { cache: "no-store" },
        );
        const payload = await response.json();
        if (cancelled) return;
        if (response.status === 401) {
          setAuthenticated(false);
          return;
        }
        if (response.ok) setState(payload.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEnrollmentState();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadEnrollmentState();
    }, 30_000);
    const handleFocus = () => void loadEnrollmentState();
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [courseId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("courseId", courseId);
      const response = await fetch("/api/enrollment-requests", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.message ?? "Could not submit your enrollment request.");
        setFields(payload.fields ?? {});
        return;
      }

      setState((current) =>
        current
          ? {
              ...current,
              request: {
                id: payload.data.id,
                status: payload.data.status,
                submittedAt: payload.data.submittedAt,
                reviewNote: null,
              },
            }
          : current,
      );
      setMessage(payload.message);
      setOpen(false);
      event.currentTarget.reset();
      setFileName("");
    } catch {
      setMessage("Could not reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <button disabled className={ctaClass("loading", compact)}>
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Checking access
      </button>
    );
  }

  if (!authenticated) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`}
        className={ctaClass("login", compact)}
      >
        <LockKeyhole className="h-4 w-4" />
        Sign in to enroll
      </Link>
    );
  }

  if (state?.hasAccess) {
    return (
      <div className={compact ? "" : "space-y-2"}>
        <Link href={`/learn/${courseSlug}`} className={ctaClass("active", compact)}>
          <CheckCircle2 className="h-4 w-4" />
          Continue course
          <ArrowRight className="h-4 w-4" />
        </Link>
        {!compact ? (
          <p className="text-center text-xs font-medium text-emerald-700">
            Access verified — your course is ready.
          </p>
        ) : null}
      </div>
    );
  }

  if (state?.request && isEnrollmentRequestOpen(state.request.status)) {
    return (
      <div className={compact ? "" : "space-y-2"}>
        <div
          className={ctaClass(
            state.request.status === "REVIEWING" ? "reviewing" : "pending",
            compact,
          )}
        >
          <Clock3 className="h-4 w-4" />
          {state.request.status === "REVIEWING" ? "Payment under review" : "Request submitted"}
        </div>
        {!compact ? (
          <p className="text-center text-xs font-medium text-amber-800/80">
            Waiting for payment verification. We will email you when access is ready.
          </p>
        ) : null}
      </div>
    );
  }

  if (state?.request?.status === "REJECTED") {
    return (
      <div className={compact ? "" : "space-y-2"}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={ctaClass("rejected", compact)}
        >
          Resubmit payment proof
          <ArrowRight className="h-4 w-4" />
        </button>
        {!compact ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs leading-5 text-red-700">
            Previous request rejected
            {state.request.reviewNote ? `: ${state.request.reviewNote}` : "."}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!state?.paymentConfigured}
        className={ctaClass("default", compact)}
      >
        Request enrollment <ArrowRight className="h-4 w-4" />
      </button>
      {!compact && !state?.paymentConfigured ? (
        <p className="mt-3 text-center text-xs text-red-600">
          bKash payment number has not been configured.
        </p>
      ) : null}

      {open && state ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="enrollment-title"
            className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-navy/8 bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                  Secure manual enrollment
                </p>
                <h2 id="enrollment-title" className="mt-1 text-xl font-semibold text-navy">
                  Submit bKash payment proof
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-navy/50 hover:bg-navy/5"
                aria-label="Close enrollment form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 sm:p-7">
              <div className="rounded-2xl border border-[#e2136e]/20 bg-[#fff5fa] p-5">
                <p className="text-sm font-semibold text-navy">{courseTitle}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <PaymentInfo label="Send money to" value={state.bkashNumber ?? "Not configured"} copy />
                  <PaymentInfo
                    label="Exact amount"
                    value={`৳${coursePrice.toLocaleString("en-US")}`}
                  />
                </div>
                <p className="mt-4 text-xs leading-5 text-navy/60">
                  Use bKash Send Money, keep the transaction ID, and take a clear screenshot showing the successful payment.
                </p>
              </div>

              <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
                <EnrollmentField label="Student phone" error={fields.studentPhone?.[0]}>
                  <input name="studentPhone" defaultValue={state.profilePhone ?? ""} required inputMode="tel" placeholder="01XXXXXXXXX" className={inputClass} />
                </EnrollmentField>
                <EnrollmentField label="Guardian phone" error={fields.guardianPhone?.[0]}>
                  <input name="guardianPhone" required inputMode="tel" placeholder="01XXXXXXXXX" className={inputClass} />
                </EnrollmentField>
                <EnrollmentField label="bKash sender number" error={fields.bkashSenderNumber?.[0]}>
                  <input name="bkashSenderNumber" required inputMode="tel" placeholder="Number used for payment" className={inputClass} />
                </EnrollmentField>
                <EnrollmentField label="Transaction ID" error={fields.bkashTransactionId?.[0]}>
                  <input name="bkashTransactionId" required autoCapitalize="characters" placeholder="Example: BQ12ABC345" className={`${inputClass} uppercase`} />
                </EnrollmentField>

                <EnrollmentField label="Your class" error={fields.classLevel?.[0]}>
                  <select
                    name="classLevel"
                    required
                    defaultValue={state.profileClassLevel ?? ""}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select class (1–12)
                    </option>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((level) => (
                      <option key={level} value={level}>
                        Class {level}
                      </option>
                    ))}
                  </select>
                </EnrollmentField>

                <div className="sm:col-span-2">
                  <EnrollmentField label="Payment screenshot" error={fields.paymentProof?.[0]}>
                    <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy/15 bg-[#f8fafc] px-4 py-5 text-center transition hover:border-btnBg/50 hover:bg-btnBg/3">
                      <ImageUp className="h-7 w-7 text-btnBg" />
                      <span className="mt-2 text-sm font-semibold text-navy">
                        {fileName || "Choose payment screenshot"}
                      </span>
                      <span className="mt-1 text-xs text-navy/45">JPG, PNG, or WebP · maximum 5 MB</span>
                      <input
                        type="file"
                        name="paymentProof"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        className="sr-only"
                        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
                      />
                    </label>
                  </EnrollmentField>
                </div>

                <div className="sm:col-span-2">
                  <EnrollmentField label="Note for our team (optional)">
                    <textarea name="studentNote" maxLength={500} rows={3} placeholder="Any information that may help us verify your enrollment" className={`${inputClass} h-auto py-3`} />
                  </EnrollmentField>
                </div>

                {message ? (
                  <div
                    role="status"
                    className={`sm:col-span-2 rounded-xl px-4 py-3 text-sm ${
                      state.request?.status === "PENDING"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {state.request?.status === "PENDING" ? (
                      <CheckCircle2 className="mr-2 inline h-4 w-4" />
                    ) : null}
                    {message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={pending || state.request?.status === "PENDING"}
                  className="sm:col-span-2 flex h-13 items-center justify-center gap-2 rounded-2xl bg-btnBg px-6 text-sm font-bold text-white shadow-lg shadow-btnBg/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
                  {pending ? "Uploading securely..." : "Submit payment for verification"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs leading-5 text-navy/45">
                Submission does not unlock the course automatically. A staff member must verify the payment first.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PaymentInfo({
  label,
  value,
  copy = false,
}: {
  label: string;
  value: string;
  copy?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/45">{label}</span>
      <div className="mt-1 flex items-center justify-between gap-2">
        <strong className="text-base text-navy">{value}</strong>
        {copy ? (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(value)}
            className="rounded-lg p-1.5 text-[#e2136e] hover:bg-[#e2136e]/8"
            aria-label="Copy bKash number"
          >
            <Copy className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EnrollmentField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-navy">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function ctaClass(
  variant:
    | "default"
    | "pending"
    | "reviewing"
    | "active"
    | "rejected"
    | "login"
    | "loading",
  compact: boolean,
) {
  return cn(
    "flex items-center justify-center gap-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
    compact ? "h-12 rounded-xl px-5" : "mt-5 h-13 w-full rounded-2xl px-5",
    variant === "default" &&
      "bg-btnBg text-white shadow-lg shadow-btnBg/20 hover:bg-[#0068d8]",
    variant === "pending" &&
      "cursor-default bg-amber-500 text-white shadow-lg shadow-amber-500/25",
    variant === "reviewing" &&
      "cursor-default bg-blue-600 text-white shadow-lg shadow-blue-600/25",
    variant === "active" &&
      "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700",
    variant === "rejected" &&
      "border-2 border-red-500 bg-red-50 text-red-700 hover:bg-red-100",
    (variant === "login" || variant === "loading") &&
      "bg-btnBg text-white shadow-lg shadow-btnBg/20 hover:bg-[#0068d8]",
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-navy/12 bg-[#f8fafc] px-4 text-sm text-navy outline-none transition placeholder:text-navy/35 focus:border-btnBg focus:ring-4 focus:ring-btnBg/10";
