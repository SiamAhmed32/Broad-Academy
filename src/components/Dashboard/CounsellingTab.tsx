"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  ImageUp,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Upload,
  Video,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import BookingForm from "@/components/ConsultationSection/BookingForm";
import { PAYMENT_STATUS_LABELS } from "@/lib/counselling/payment";
import type { CounsellingBookingSummary, StudentProfile } from "@/lib/student/types";

type View = "sessions" | "book";

type BookingCounts = {
  PENDING: number;
  CONFIRMED: number;
  COMPLETED: number;
  CANCELLED: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export function CounsellingTab({
  profile,
  notify,
}: {
  profile: StudentProfile;
  notify: (message: string, error?: boolean) => void;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<View>("sessions");
  const [bookings, setBookings] = useState<CounsellingBookingSummary[]>([]);
  const [counts, setCounts] = useState<BookingCounts>({
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState({
    bkashNumber: null as string | null,
    paymentConfigured: false,
  });
  const detailRef = useRef<HTMLElement>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/counselling/bookings?${params}`, {
        credentials: "same-origin",
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Could not load sessions.");
      }

      const nextBookings = payload.data.bookings as CounsellingBookingSummary[];
      setBookings(nextBookings);
      setCounts(payload.data.counts);
      setPagination(payload.data.pagination);
      if (payload.data.paymentConfig) {
        setPaymentConfig(payload.data.paymentConfig);
      }
      setActiveBookingId((current) => {
        if (current && nextBookings.some((booking) => booking.id === current)) {
          return current;
        }
        return nextBookings[0]?.id ?? null;
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not load sessions.", true);
    } finally {
      setLoading(false);
    }
  }, [notify, pagination.limit, pagination.page, search, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBookings();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [loadBookings]);

  const activeBooking =
    bookings.find((booking) => booking.id === activeBookingId) ?? null;
  const totalSessions =
    counts.PENDING + counts.CONFIRMED + counts.COMPLETED + counts.CANCELLED;
  const hasActiveBooking = counts.PENDING + counts.CONFIRMED > 0;

  function selectBooking(id: string) {
    setActiveBookingId(id);
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  function handleBookSuccess() {
    notify("Parent counselling request submitted. We'll contact you about fees soon.");
    setView("sessions");
    setPagination((current) => ({ ...current, page: 1 }));
    router.refresh();
    void loadBookings();
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-clip">
      <div className="relative isolate w-full overflow-hidden rounded-2xl border border-navy/8 bg-white p-4 shadow-[0_20px_60px_rgba(22,51,81,0.06)] sm:rounded-[2rem] sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 hidden h-48 w-48 rounded-full bg-btnBg/10 blur-3xl sm:block" />
        <div className="pointer-events-none absolute -bottom-20 left-10 hidden h-40 w-40 rounded-full bg-accent/10 blur-3xl sm:block" />

        <div className="relative w-full min-w-0">
        <div className="relative flex w-full min-w-0 flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent sm:text-xs sm:tracking-[0.22em]">
              Parent academic support
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold text-navy sm:text-3xl lg:text-4xl">
              Parent counselling sessions
            </h1>
            <p className="mt-2 break-words text-sm leading-6 text-navy/55 sm:mt-3 sm:max-w-2xl sm:leading-7 sm:text-base">
              Request a one-on-one guidance session for your child. Fees are confirmed by
              our team before your appointment — no surprises.
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {view === "book" ? (
              <button
                type="button"
                onClick={() => setView("sessions")}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-navy/10 bg-white px-4 text-sm font-semibold text-navy transition hover:bg-navy/5 sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sessions
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView("book")}
                disabled={loading || hasActiveBooking}
                title={
                  hasActiveBooking
                    ? "Complete or cancel your active request before booking another session."
                    : undefined
                }
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-5 text-sm font-bold text-white shadow-lg shadow-btnBg/20 transition hover:bg-btnBg/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:w-auto sm:hover:-translate-y-0.5 disabled:sm:hover:translate-y-0"
              >
                <Plus className="h-4 w-4" />
                {hasActiveBooking ? "Active request exists" : "Book parent session"}
              </button>
            )}
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-4 sm:gap-3">
          <StatPill label="Total" value={totalSessions} />
          <StatPill label="Pending" value={counts.PENDING} tone="amber" />
          <StatPill label="Confirmed" value={counts.CONFIRMED} tone="blue" />
          <StatPill label="Completed" value={counts.COMPLETED} tone="emerald" />
        </div>
        </div>
      </div>

      <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-6">
      <AnimatePresence mode="wait">
        {view === "book" ? (
          <motion.div
            key="book"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="w-full min-w-0 rounded-2xl border border-navy/8 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
          >
            <h2 className="text-xl font-semibold text-navy">New parent counselling request</h2>
            <p className="mt-2 text-sm text-navy/55">
              Tell us what your child needs help with. We&apos;ll reach out to confirm
              timing and session fees.
            </p>
            <div className="mt-6 max-w-3xl">
              <BookingForm
                mode="dashboard"
                compact
                lockedFields={[
                  "fullName",
                  "email",
                  ...(profile.phone ? (["phone"] as const) : []),
                ]}
                defaultValues={{
                  fullName: profile.fullName,
                  email: profile.email,
                  phone: profile.phone ?? "",
                }}
                onSuccess={handleBookSuccess}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sessions"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="grid w-full min-w-0 max-w-full gap-4 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)] xl:gap-6"
          >
            <section className="flex w-full min-w-0 flex-col rounded-2xl border border-navy/8 bg-white shadow-sm xl:min-h-[520px]">
              <div className="border-b border-navy/8 p-3 sm:p-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPagination((current) => ({ ...current, page: 1 }));
                    }}
                    placeholder="Search subject or notes..."
                    className="h-11 w-full rounded-xl border border-navy/10 bg-[#f7f9fc] pl-10 pr-4 text-sm text-navy outline-none transition focus:border-btnBg focus:bg-white focus:ring-2 focus:ring-btnBg/10"
                  />
                </div>
                <div className="mt-3 flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch]">
                  {STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter.value || "all"}
                      type="button"
                      onClick={() => {
                        setStatusFilter(filter.value);
                        setPagination((current) => ({ ...current, page: 1 }));
                      }}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        statusFilter === filter.value
                          ? "bg-btnBg text-white"
                          : "bg-[#f7f9fc] text-navy/60 hover:bg-navy/5"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 sm:p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-navy/45">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading sessions...
                  </div>
                ) : bookings.length === 0 ? (
                  <EmptySessions onBook={() => setView("book")} />
                ) : (
                  <ul className="space-y-2">
                    {bookings.map((booking) => (
                      <li key={booking.id}>
                        <button
                          type="button"
                          onClick={() => selectBooking(booking.id)}
                          className={`w-full rounded-xl border p-3.5 text-left transition sm:rounded-2xl sm:p-4 ${
                            activeBookingId === booking.id
                              ? "border-btnBg/25 bg-btnBg/5 shadow-sm"
                              : "border-navy/8 bg-white hover:border-navy/15 hover:bg-[#f7f9fc]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-navy">
                                {booking.subjectInterest}
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-navy/45">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatDate(booking.preferredDate)}
                              </p>
                            </div>
                            <StatusBadge status={booking.status} compact />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {pagination.totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-navy/8 px-4 py-3 text-sm">
                  <button
                    type="button"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() =>
                      setPagination((current) => ({ ...current, page: current.page - 1 }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-navy/60 transition hover:bg-navy/5 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <span className="text-xs font-medium text-navy/45">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages || loading}
                    onClick={() =>
                      setPagination((current) => ({ ...current, page: current.page + 1 }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-navy/60 transition hover:bg-navy/5 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </section>

            <section
              ref={detailRef}
              className={`w-full min-w-0 scroll-mt-24 rounded-2xl border border-navy/8 bg-white p-4 shadow-sm sm:p-6 lg:p-8 xl:min-h-[520px] ${
                activeBooking ? "block pb-[max(1.5rem,env(safe-area-inset-bottom))]" : "hidden xl:block"
              }`}
            >
              {loading && !activeBooking ? (
                <div className="flex items-center justify-center py-10 text-sm text-navy/45">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading details...
                </div>
              ) : activeBooking ? (
                <BookingDetails
                  booking={activeBooking}
                  notify={notify}
                  onRefresh={loadBookings}
                  paymentConfig={paymentConfig}
                />
              ) : (
                <div className="hidden flex-col items-center justify-center py-12 text-center xl:flex">
                  <CalendarDays className="h-10 w-10 text-navy/20" />
                  <p className="mt-4 text-sm font-medium text-navy/55">
                    Select a session to view details
                  </p>
                  <button
                    type="button"
                    onClick={() => setView("book")}
                    className="mt-4 text-sm font-semibold text-btnBg hover:underline"
                  >
                    Or book a new session
                  </button>
                </div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "amber" | "blue" | "emerald";
}) {
  const tones = {
    slate: "bg-[#f7f9fc] text-navy",
    amber: "bg-amber-50 text-amber-800",
    blue: "bg-sky-50 text-sky-800",
    emerald: "bg-emerald-50 text-emerald-800",
  };

  return (
    <div className={`rounded-xl px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3 ${tones[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70 sm:text-[11px] sm:tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-bold sm:mt-1 sm:text-2xl">{value.toLocaleString()}</p>
    </div>
  );
}

function EmptySessions({ onBook }: { onBook: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-8 text-center sm:px-4 sm:py-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-heroBg text-accent">
        <CalendarDays className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-semibold text-navy">No sessions yet</h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-navy/45">
        Book your first parent counselling session and our team will contact you
        about fees and scheduling.
      </p>
      <button
        type="button"
        onClick={onBook}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-btnBg px-4 text-sm font-semibold text-white"
      >
        <Plus className="h-4 w-4" />
        Book parent session
      </button>
    </div>
  );
}

function BookingDetails({
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
  const [uploading, setUploading] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [proofFileName, setProofFileName] = useState("");

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      notify("File size must be under 10 MB.", true);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/counselling/bookings/${booking.id}/files`, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message ?? "Upload failed.");
      }

      notify("File uploaded successfully.");
      await onRefresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Upload failed.", true);
    } finally {
      setUploading(false);
    }
  }

  async function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmittingPayment(true);
    try {
      const response = await fetch(`/api/counselling/bookings/${booking.id}/payment`, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
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
      notify(error instanceof Error ? error.message : "Payment submission failed.", true);
    } finally {
      setSubmittingPayment(false);
    }
  }

  const showPaymentSection =
    booking.paymentStatus !== "UNQUOTED" || booking.sessionFee != null;

  return (
    <div className="space-y-5 pb-4 sm:space-y-8 sm:pb-0">
      <div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <StatusBadge status={booking.status} />
          <span className="text-xs text-navy/40">
            Requested {formatDate(booking.createdAt)}
          </span>
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-navy sm:mt-4 sm:text-2xl">
          {booking.subjectInterest}
        </h2>

        <div className="mt-4 grid gap-3 rounded-2xl bg-[#f7f9fc] p-3.5 sm:mt-5 sm:gap-4 sm:p-4 sm:grid-cols-2">
          <InfoCell icon={CalendarDays} label="Preferred date" value={formatDate(booking.preferredDate)} />
          <InfoCell icon={Clock3} label="Preferred time" value={booking.preferredTime} />
          <InfoCell icon={FileText} label="Education level" value={booking.educationLevel} />
        </div>

        {booking.status === "PENDING" ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {booking.paymentStatus === "AWAITING_PAYMENT"
              ? "Your session fee has been quoted. Submit bKash payment proof below to continue."
              : booking.paymentStatus === "PROOF_SUBMITTED"
                ? "Your payment proof is under review. We will confirm your session after verification."
                : "Your request is being reviewed. Our team will contact you to confirm the session and share the fee."}
          </p>
        ) : null}

        {showPaymentSection ? (
          <CounsellingPaymentPanel
            booking={booking}
            paymentConfig={paymentConfig}
            submitting={submittingPayment}
            proofFileName={proofFileName}
            onProofChange={setProofFileName}
            onSubmit={handlePaymentSubmit}
          />
        ) : null}

        {booking.message ? (
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-navy/45">
              Your message
            </p>
            <p className="text-sm leading-relaxed text-navy/70">{booking.message}</p>
          </div>
        ) : null}
      </div>

      {booking.status === "CONFIRMED" && booking.meetingLink ? (
        <div className="rounded-2xl border border-btnBg/20 bg-btnBg/8 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-btnBg text-white">
              <Video className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-navy">Join online session</h3>
              <p className="mt-1 text-sm text-navy/60">
                Your counsellor has shared a meeting link for this session.
              </p>
              <a
                href={booking.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-4 text-sm font-bold text-white transition hover:bg-btnBg/90 sm:w-auto"
              >
                Open meeting link
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {booking.counsellorNotes ? (
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-navy/45">
            <MessageSquare className="h-4 w-4" />
            Counsellor notes
          </p>
          <div className="rounded-2xl border-l-4 border-accent bg-[#f7f9fc] p-4 text-sm leading-relaxed text-navy/80">
            {booking.counsellorNotes}
          </div>
        </div>
      ) : null}

      <div className="border-t border-navy/8 pt-5 pb-4 sm:pt-6 sm:pb-2">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-navy">Shared files</p>
          <label className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-xs font-bold text-navy transition hover:bg-navy/5 sm:w-auto sm:py-1.5">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploading ? "Uploading..." : "Upload file"}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt,.zip"
            />
          </label>
        </div>

        {booking.files.length > 0 ? (
          <ul className="space-y-2">
            {booking.files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between rounded-xl border border-navy/8 p-3 transition hover:bg-[#f7f9fc]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-heroBg text-accent">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy">{file.fileName}</p>
                    <p className="text-[10px] text-navy/45">
                      {file.uploadedByName} • {formatDate(file.createdAt)}
                    </p>
                  </div>
                </div>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy/45 transition hover:bg-navy/10 hover:text-navy"
                  title="Open file"
                >
                  <Download className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-navy/12 py-8 text-center text-sm text-navy/45">
            Upload syllabus, past papers, or other documents for your counsellor.
          </div>
        )}
      </div>
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
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${paymentTone}`}>
          {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
        </span>
      </div>

      {booking.sessionFee != null && booking.sessionFee > 0 ? (
        <p className="mt-3 text-2xl font-bold text-navy">
          ৳{booking.sessionFee.toLocaleString("en-US")}
        </p>
      ) : null}

      {booking.paymentStatus === "PAID" || booking.paymentStatus === "WAIVED" ? (
        <p className="mt-3 text-sm text-navy/65">
          {booking.paymentStatus === "PAID"
            ? "Payment verified. Your session can be confirmed."
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
              Use bKash Send Money, keep the transaction ID, and upload a clear screenshot.
            </p>
          </div>

          {!paymentConfig.paymentConfigured ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Payment is not configured yet. Please contact support.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-navy">bKash sender number</span>
                <input
                  name="bkashSenderNumber"
                  required
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                  className="mt-1.5 h-10 w-full rounded-xl border border-navy/10 px-3 text-sm outline-none focus:border-btnBg"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-navy">Transaction ID</span>
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
                  <span className="mt-1 text-xs text-navy/45">JPG, PNG, or WebP · max 5 MB</span>
                  <input
                    type="file"
                    name="paymentProof"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="sr-only"
                    onChange={(event) => onProofChange(event.target.files?.[0]?.name ?? "")}
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="sm:col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-btnBg px-4 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
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
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy/40">{label}</p>
      <div className="mt-1.5 flex items-center gap-2 text-sm font-medium text-navy">
        <Icon className="h-4 w-4 text-btnBg" />
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status, compact }: { status: string; compact?: boolean }) {
  const config = {
    PENDING: { color: "bg-amber-50 text-amber-700", icon: Clock3, label: "Pending" },
    CONFIRMED: { color: "bg-sky-50 text-sky-700", icon: CheckCircle2, label: "Confirmed" },
    COMPLETED: { color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2, label: "Completed" },
    CANCELLED: { color: "bg-slate-100 text-slate-600", icon: XCircle, label: "Cancelled" },
  }[status] || { color: "bg-slate-100 text-slate-600", icon: AlertCircle, label: status };

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
