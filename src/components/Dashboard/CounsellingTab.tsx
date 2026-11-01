"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  List,
  Loader2,
  Plus,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import BookingForm from "@/components/ConsultationSection/BookingForm";
import type {
  CounsellingBookingSummary,
  StudentProfile,
} from "@/lib/student/types";
import { dhakaDateKey } from "@/lib/counselling/calendar";
import { formatSessionDateTime } from "@/lib/counselling/schedule";
import { PAYMENT_STATUS_LABELS } from "@/lib/counselling/payment";
import { BookingDetails } from "./counselling/BookingDetails";
import { SessionCalendar } from "./counselling/SessionCalendar";
import { useCounsellingSessions } from "./counselling/useCounsellingSessions";
import {
  sessionNextStep,
  sessionStatusStyles,
} from "./counselling/sessionPresentation";

const filters = [
  { value: "", label: "All sessions" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function CounsellingTab({
  profile,
  notify,
  view: controlledView,
  onViewChange: controlledOnViewChange,
}: {
  profile: StudentProfile;
  notify: (message: string, error?: boolean) => void;
  view?: "list" | "calendar";
  onViewChange?: (view: "list" | "calendar") => void;
}) {
  const router = useRouter();
  const dialogOpener = useRef<HTMLElement | null>(null);
  const pageTitle = useRef<HTMLHeadingElement>(null);
  function openBooking() {
    dialogOpener.current = document.activeElement as HTMLElement;
    setBookingOpen(true);
  }
  function openSession(booking: CounsellingBookingSummary) {
    dialogOpener.current = document.activeElement as HTMLElement;
    setSelected(booking);
  }
  function restoreFocus(event: Event) {
    event.preventDefault();
    const target = dialogOpener.current;
    if (target?.isConnected && !target.matches(":disabled")) target.focus();
    else pageTitle.current?.focus();
  }
  const [internalView, setInternalView] = useState<"list" | "calendar">(
    "calendar",
  );
  const view = controlledView ?? internalView;
  const [month, setMonth] = useState(() =>
    dhakaDateKey(new Date()).slice(0, 7),
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selected, setSelected] = useState<CounsellingBookingSummary | null>(
    null,
  );
  const { data, loading, error, refresh } = useCounsellingSessions({
    search,
    status,
    page,
    month: view === "calendar" ? month : undefined,
  });
  const bookings = data?.bookings ?? [];
  const currentBooking = selected
    ? (bookings.find((booking) => booking.id === selected.id) ?? selected)
    : null;
  const pending = data?.counts.PENDING ?? 0;
  const total = data
    ? Object.values(data.counts).reduce((sum, count) => sum + count, 0)
    : 0;
  const paymentConfig = data?.paymentConfig ?? {
    bkashNumber: null,
    paymentConfigured: false,
  };

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }
  function changeView(value: "list" | "calendar") {
    if (controlledOnViewChange) controlledOnViewChange(value);
    else setInternalView(value);
    setPage(1);
  }
  async function bookingSuccess() {
    setBookingOpen(false);
    setSearch("");
    setStatus("");
    setPage(1);
    await refresh(true);
    router.refresh();
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-btnBg">
            Your learning support
          </p>
          <h1
            ref={pageTitle}
            tabIndex={-1}
            className="text-2xl font-bold tracking-tight text-navy sm:text-3xl"
          >
            Study Plan &amp; Counselling
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your requests, appointments and shared documents in one place.
          </p>
        </div>
        <button
          type="button"
          disabled={!data || pending > 0}
          onClick={openBooking}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-btnBg px-4 text-sm font-semibold text-white transition hover:bg-btnBgDark disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus className="h-4 w-4" />
          Request a session
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "All requests",
            value: total,
            icon: List,
            tone: "text-slate-500",
            filter: "",
          },
          {
            label: "Pending requests",
            value: pending,
            icon: Clock3,
            tone: "text-amber-600",
            filter: "PENDING",
          },
          {
            label: "Confirmed",
            value: data?.counts.CONFIRMED ?? 0,
            icon: CalendarDays,
            tone: "text-btnBg",
            filter: "CONFIRMED",
          },
          {
            label: "Completed",
            value: data?.counts.COMPLETED ?? 0,
            icon: Check,
            tone: "text-emerald-600",
            filter: "COMPLETED",
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => changeStatus(item.filter)}
            className={`flex items-center gap-3 rounded-xl border bg-white p-3.5 text-left transition sm:p-4 ${status === item.filter ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}
          >
            <span className={`rounded-lg bg-slate-50 p-2.5 ${item.tone}`}>
              <item.icon className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs text-slate-500">{item.label}</span>
              <span className="mt-0.5 block text-xl font-bold">
                {data ? item.value : "—"}
              </span>
            </span>
          </button>
        ))}
      </div>

      {pending > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            You have a pending request. Open its details to see the next step.
            You can request another session once it is confirmed or closed.
          </p>
        </div>
      ) : null}

      <section
        className="min-w-0 space-y-4"
        aria-label="Your counselling sessions"
        aria-busy={loading}
      >
        {view === "list" ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
            <div
              className="inline-flex self-start rounded-lg bg-slate-100 p-1"
              role="group"
              aria-label="Session view"
            >
              {(
                [
                  { value: "list", label: "List", icon: List },
                  { value: "calendar", label: "Calendar", icon: CalendarDays },
                ] as const
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={view === item.value}
                  onClick={() => changeView(item.value)}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${view === item.value ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
            <label className="relative min-w-0 flex-1 sm:min-w-48">
              <span className="sr-only">Search sessions</span>
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name, class or school"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="flex gap-2">
              <label className="min-w-0 flex-1 sm:flex-none">
                <span className="sr-only">Session status</span>
                <select
                  value={status}
                  onChange={(event) => changeStatus(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {filters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                aria-label="Refresh sessions"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : null}
        {loading ? (
          <div
            role="status"
            className="flex items-center gap-2 px-1 text-xs text-slate-500"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {data ? "Updating sessions…" : "Loading your sessions…"}
          </div>
        ) : null}

        {view === "calendar" ? (
          <SessionCalendar
            month={month}
            bookings={bookings}
            onMonthChange={setMonth}
            onSelect={openSession}
            onNewSession={openBooking}
            canBook={!data || pending === 0}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <h2 className="text-sm font-semibold">Your sessions</h2>
              <span className="text-xs text-slate-400">
                {data
                  ? `${data.pagination.total} ${data.pagination.total === 1 ? "request" : "requests"}`
                  : "Loading"}
              </span>
            </div>
            <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_150px_140px_44px] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:grid">
              <span>Session / Student</span>
              <span>Schedule · Bangladesh time</span>
              <span>Status</span>
              <span>Payment</span>
              <span className="sr-only">Details</span>
            </div>
            {!data && loading ? (
              <div className="space-y-4 p-5" aria-hidden="true">
                {[1, 2, 3].map((key) => (
                  <div
                    key={key}
                    className="h-20 animate-pulse rounded-xl bg-slate-50"
                  />
                ))}
              </div>
            ) : bookings.length ? (
              <ul className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <li key={booking.id}>
                    <button
                      type="button"
                      onClick={() => openSession(booking)}
                      className="group grid w-full min-w-0 gap-3 p-4 text-left transition hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-blue-500 sm:p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_150px_140px_44px] lg:items-center lg:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy">
                          {booking.fullName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.educationLevel} · Requested{" "}
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "Asia/Dhaka",
                          }).format(new Date(booking.createdAt))}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-500 lg:sr-only">
                          {sessionNextStep(booking)}
                        </p>
                      </div>
                      <div className="text-xs leading-5">
                        <p
                          className={
                            booking.scheduledAt
                              ? "font-medium text-navy"
                              : "text-slate-500"
                          }
                        >
                          {formatSessionDateTime(booking.scheduledAt) ??
                            "Awaiting schedule"}
                        </p>
                        {!booking.scheduledAt ? (
                          <p className="text-[11px] text-slate-400">
                            Our team will arrange the time
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${sessionStatusStyles[booking.status]}`}
                      >
                        {booking.status.toLowerCase()}
                      </span>
                      <span className="text-xs text-slate-500">
                        {booking.sessionFee != null &&
                        booking.sessionFee > 0 ? (
                          <span className="mr-2 font-semibold text-navy">
                            ৳{booking.sessionFee.toLocaleString()}
                          </span>
                        ) : null}
                        {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-btnBg lg:justify-end">
                        <span className="lg:sr-only">View details</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : !error ? (
              <div className="px-5 py-16 text-center">
                <CalendarDays className="mx-auto h-9 w-9 text-slate-300" />
                <h3 className="mt-4 text-sm font-semibold">
                  {search || status
                    ? "No matching sessions"
                    : "Your support journey starts here"}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {search || status
                    ? "Try a different search or clear your filters."
                    : "Request a study plan or counselling session. Our team will help with the next steps."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (search || status) {
                      setSearch("");
                      changeStatus("");
                    } else openBooking();
                  }}
                  className="mt-5 text-sm font-semibold text-btnBg"
                >
                  {search || status ? "Clear filters" : "Request a session"}
                </button>
              </div>
            ) : null}
            {data && data.pagination.totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <span className="text-xs text-slate-500">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loading || page <= 1}
                    onClick={() => setPage(page - 1)}
                    aria-label="Previous page"
                    className="rounded-lg border p-2 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={loading || page >= data.pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    aria-label="Next page"
                    className="rounded-lg border p-2 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <Dialog.Root open={bookingOpen} onOpenChange={setBookingOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[150] bg-navy/45 backdrop-blur-sm" />
          <Dialog.Content
            onCloseAutoFocus={restoreFocus}
            className="fixed left-1/2 top-1/2 z-[151] max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <Dialog.Title lang="bn" className="font-bangla pr-9 text-lg font-bold">
              স্টাডি প্ল্যান ও কাউন্সেলিং সেশনের জন্য আবেদন করুন
            </Dialog.Title>
            <Dialog.Description lang="bn" className="font-bangla mt-2 text-sm leading-6 text-slate-500">
              সর্তকতার সাথে ফরমটি ফিলাপ করুন, খুব অল্প কথায় শিক্ষার্থীর সমস্যাগুলো
              জানান পরবর্তীতে আমাদের টিম আপনার সাথে যোগাযোগ করবে।
            </Dialog.Description>
            <Dialog.Close
              aria-label="Close booking form"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 transition-all hover:border-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 active:scale-95"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </Dialog.Close>
            <div className="mt-5">
              <BookingForm
                mode="dashboard"
                initialAccount={{ email: profile.email, phone: profile.phone }}
                defaultValues={{
                  email: profile.email,
                  phone: profile.phone ?? "",
                }}
                onSuccess={() => void bookingSuccess()}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[150] bg-navy/45 backdrop-blur-sm" />
          <Dialog.Content
            onCloseAutoFocus={restoreFocus}
            className="fixed left-1/2 top-1/2 z-[151] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-4rem)]"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div>
                <Dialog.Title className="text-base font-bold">
                  Session details
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-slate-500">
                  Review the schedule, payment and documents for this request.
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close session details"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 transition-all hover:border-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 active:scale-95"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </Dialog.Close>
            </div>
            <div className="p-5 sm:p-7">
              {currentBooking ? (
                <BookingDetails
                  key={currentBooking.id}
                  booking={currentBooking}
                  notify={notify}
                  onRefresh={() => refresh(true)}
                  paymentConfig={paymentConfig}
                />
              ) : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
