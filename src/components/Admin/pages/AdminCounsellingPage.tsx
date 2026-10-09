"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Inbox,
  Link as LinkIcon,
  RotateCcw,
  Save,
  Search,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
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
import AdminSessionFiles from "@/components/Admin/counselling/AdminSessionFiles";
import Modal from "@/components/reusables/Modal";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";
import { PAYMENT_STATUS_LABELS } from "@/lib/counselling/payment";
import {
  formatSessionDateTime,
  fromDhakaDateTimeInput,
  toDhakaDateTimeInput,
} from "@/lib/counselling/schedule";
import { useStagedFiles } from "@/lib/counselling/use-staged-files";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
type PaymentStatus =
  | "UNQUOTED"
  | "AWAITING_PAYMENT"
  | "PROOF_SUBMITTED"
  | "PAID"
  | "WAIVED";
type ListView = "active" | "archived";

type BookingFile = {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedByRole: string;
  uploadedByName: string;
  createdAt: string;
};

type Booking = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  educationLevel: string;
  schoolName: string | null;
  classRoll: string | null;
  studentGroup: string | null;
  subjectInterest: string;
  preferredDate: string;
  preferredTime: string;
  scheduledAt: string | null;
  message: string | null;
  status: BookingStatus;
  meetingLink: string | null;
  counsellorNotes: string | null;
  sessionFee: number | null;
  paymentStatus: PaymentStatus;
  bkashSenderNumber: string | null;
  bkashTransactionId: string | null;
  paymentSubmittedAt: string | null;
  paidAt: string | null;
  paymentNote: string | null;
  hasPaymentProof: boolean;
  archivedAt: string | null;
  archivedById: string | null;
  createdAt: string;
  updatedAt: string;
  files: BookingFile[];
};

type Counts = Record<BookingStatus, number> & { ARCHIVED: number };

const statusVariant = {
  PENDING: "warning" as const,
  CONFIRMED: "info" as const,
  COMPLETED: "success" as const,
  CANCELLED: "muted" as const,
};

const paymentVariant = {
  UNQUOTED: "muted" as const,
  AWAITING_PAYMENT: "warning" as const,
  PROOF_SUBMITTED: "info" as const,
  PAID: "success" as const,
  WAIVED: "success" as const,
};

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 1,
};

const emptyCounts: Counts = {
  PENDING: 0,
  CONFIRMED: 0,
  COMPLETED: 0,
  CANCELLED: 0,
  ARCHIVED: 0,
};

export default function AdminCounsellingPage() {
  const reduceMotion = useReducedMotion();
  const { showToast } = useAdminToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(emptyPagination);
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [view, setView] = useState<ListView>("active");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [subject, setSubject] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState({
    subjects: [] as string[],
    educationLevels: [] as string[],
  });
  const [canPermanentlyDelete, setCanPermanentlyDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(emptyPagination.limit),
      view,
      sort,
    });
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    if (subject) params.set("subject", subject);
    if (educationLevel) params.set("educationLevel", educationLevel);
    if (dateFrom) params.set("dateFrom", new Date(`${dateFrom}T00:00:00`).toISOString());
    if (dateTo) params.set("dateTo", new Date(`${dateTo}T23:59:59`).toISOString());

    const response = await adminFetch<{
      bookings: Booking[];
      counts: Counts;
      pagination: AdminPaginationMeta;
      filters: { subjects: string[]; educationLevels: string[] };
      capabilities: { canPermanentlyDelete: boolean };
    }>(`/api/admin/counselling?${params.toString()}`);

    if (response.success && response.data) {
      setBookings(response.data.bookings);
      setCounts(response.data.counts);
      setPagination(response.data.pagination);
      setFilters(response.data.filters);
      setCanPermanentlyDelete(response.data.capabilities.canPermanentlyDelete);
      setSelected((current) => {
        if (!current) return null;
        return response.data?.bookings.find((item) => item.id === current.id) ?? current;
      });
    } else if (!silent) {
      showToast(response.message || "Could not load counselling sessions.", true);
    }
    setLoading(false);
  }, [
    dateFrom,
    dateTo,
    educationLevel,
    page,
    paymentStatus,
    search,
    showToast,
    sort,
    status,
    subject,
    view,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBookings(), 250);
    return () => window.clearTimeout(timer);
  }, [loadBookings]);

  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        void loadBookings(true);
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadBookings(true);
      }
    }, 15_000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.clearInterval(interval);
    };
  }, [loadBookings]);

  function changeView(nextView: ListView) {
    setView(nextView);
    setPage(1);
    setSelected(null);
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPaymentStatus("");
    setSubject("");
    setEducationLevel("");
    setDateFrom("");
    setDateTo("");
    setSort("newest");
    setPage(1);
  }

  async function deleteBooking(confirmation: string) {
    if (!deleteTarget) return;
    if (confirmation !== "DELETE") {
      showToast("Type DELETE exactly to confirm.", true);
      return;
    }
    setDeleting(true);
    const response = await adminFetch("/api/admin/counselling", {
      method: "DELETE",
      body: JSON.stringify({ id: deleteTarget.id, confirmation }),
    });
    setDeleting(false);
    if (!response.success) {
      showToast(response.message || "Could not delete the record.", true);
      return;
    }
    showToast("Counselling record permanently deleted.");
    setDeleteTarget(null);
    setSelected(null);
    void loadBookings();
  }

  const activeTotal =
    counts.PENDING + counts.CONFIRMED + counts.COMPLETED + counts.CANCELLED;

  return (
    <div>
      <AdminPageHeader
        title="Counselling operations"
        description="Manage requests at scale with a compact queue, detailed session workspace, archive lifecycle, and protected record deletion."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-5">
        <StatCard label="Pending" value={counts.PENDING} icon={Clock} accent="text-amber-600" />
        <StatCard label="Confirmed" value={counts.CONFIRMED} icon={CalendarClock} accent="text-sky-600" />
        <StatCard label="Completed" value={counts.COMPLETED} icon={CheckCircle2} accent="text-emerald-600" />
        <StatCard label="Cancelled" value={counts.CANCELLED} icon={XCircle} accent="text-slate-500" />
        <StatCard label="Archived" value={counts.ARCHIVED} icon={Archive} accent="text-violet-600" />
      </div>

      <AdminCard className="mb-5 overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-slate-50 p-1">
            <TabButton
              active={view === "active"}
              label="Active records"
              count={activeTotal}
              icon={Inbox}
              onClick={() => changeView("active")}
            />
            <TabButton
              active={view === "archived"}
              label="Archive"
              count={counts.ARCHIVED}
              icon={Archive}
              onClick={() => changeView("archived")}
            />
          </div>
          <p className="text-xs text-slate-500">
            Completed and cancelled sessions auto-archive after 90 days.
          </p>
        </div>

        <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <AdminInput
              className="pl-10"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, phone, email, school or transaction ID..."
            />
          </div>
          <AdminSelect value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All session statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </AdminSelect>
          <AdminSelect value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1); }}>
            <option value="">All payment statuses</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </AdminSelect>
          <AdminSelect value={educationLevel} onChange={(event) => { setEducationLevel(event.target.value); setPage(1); }}>
            <option value="">All classes</option>
            {filters.educationLevels.map((item) => <option key={item} value={item}>{item}</option>)}
          </AdminSelect>
          <AdminInput type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} aria-label="Session date from" title="Session date from" />
          <AdminInput type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} aria-label="Session date to" title="Session date to" />
          <AdminSelect value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="newest">Newest requests</option>
            <option value="oldest">Oldest requests</option>
            <option value="session-soonest">Session date: soonest</option>
            <option value="session-latest">Session date: latest</option>
            <option value="name-asc">Student name A–Z</option>
          </AdminSelect>
          <div className="flex items-center gap-2">
            <AdminButton variant="ghost" onClick={clearFilters}>
              Clear filters
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => void loadBookings()} isLoading={loading}>
              <RotateCcw className="h-4 w-4" /> Refresh
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      <AdminCard className="overflow-hidden p-0">
        {loading ? (
          <AdminLoading label="Loading counselling sessions..." />
        ) : bookings.length === 0 ? (
          <AdminEmpty
            title={view === "archived" ? "Archive is empty" : "No sessions found"}
            description="Try changing your search or filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-navy">Student</th>
                    <th className="px-5 py-3 font-semibold text-navy">Session</th>
                    <th className="px-5 py-3 font-semibold text-navy">Status</th>
                    <th className="px-5 py-3 font-semibold text-navy">Payment</th>
                    <th className="px-5 py-3 font-semibold text-navy">Requested</th>
                    <th className="px-5 py-3 text-right font-semibold text-navy">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, index) => (
                    <motion.tr
                      key={booking.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-navy">{booking.fullName}</p>
                        <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500">{booking.email}</p>
                        <p className="text-xs text-slate-400">{booking.phone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-navy">
                          {formatSessionDateTime(booking.scheduledAt) ?? (
                            <span className="text-slate-400">Not scheduled yet</span>
                          )}
                        </p>
                        <p className="mt-0.5 max-w-[240px] truncate text-xs text-slate-500">
                          {booking.educationLevel}
                          {booking.schoolName ? ` · ${booking.schoolName}` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <AdminBadge variant={statusVariant[booking.status]}>
                          {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                        </AdminBadge>
                      </td>
                      <td className="px-5 py-4">
                        <AdminBadge variant={paymentVariant[booking.paymentStatus]}>
                          {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
                        </AdminBadge>
                        {booking.sessionFee ? (
                          <p className="mt-1 text-xs font-semibold text-emerald-700">
                            ৳{booking.sessionFee.toLocaleString("en-US")}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {formatAdminDate(booking.createdAt)}
                        {booking.files.length ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                            <FileText className="h-3 w-3" /> {booking.files.length} files
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(booking)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-navy transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                          aria-label={`Manage counselling session for ${booking.fullName}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </AdminCard>

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Counselling session details"
        size="xl"
      >
        {selected ? (
          <SessionWorkspace
            key={selected.id}
            booking={selected}
            canPermanentlyDelete={canPermanentlyDelete}
            onChanged={async (updated) => {
              setSelected(updated);
              await loadBookings(true);
            }}
            onRefresh={() => loadBookings(true)}
            onClosed={() => setSelected(null)}
            onDelete={() => setDeleteTarget(selected)}
            showToast={showToast}
          />
        ) : null}
      </Modal>

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title="Permanently delete this record?"
        description="This removes the archived counselling record, uploaded files, and payment proof. This action cannot be undone."
        confirmLabel="Delete permanently"
        variant="danger"
        note={{
          label: "Type DELETE to confirm",
          placeholder: "DELETE",
          required: true,
        }}
        isLoading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(note) => void deleteBooking(note)}
      />
    </div>
  );
}

function SessionWorkspace({
  booking,
  canPermanentlyDelete,
  onChanged,
  onRefresh,
  onClosed,
  onDelete,
  showToast,
}: {
  booking: Booking;
  canPermanentlyDelete: boolean;
  onChanged: (booking: Booking) => Promise<void>;
  onRefresh: () => Promise<void>;
  onClosed: () => void;
  onDelete: () => void;
  showToast: (message: string, error?: boolean) => void;
}) {
  const [status, setStatus] = useState(booking.status);
  const [scheduledAt, setScheduledAt] = useState(toDhakaDateTimeInput(booking.scheduledAt));
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink || "");
  const [counsellorNotes, setCounsellorNotes] = useState(booking.counsellorNotes || "");
  const [sessionFee, setSessionFee] = useState(booking.sessionFee == null ? "" : String(booking.sessionFee));
  const [paymentNote, setPaymentNote] = useState(booking.paymentNote || "");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  // Files picked here are only shared when "Save changes" is clicked.
  const files = useStagedFiles(booking.id);
  const archived = Boolean(booking.archivedAt);

  /** Saves changes; returns the updated session or null (after showing the error). */
  async function patch(body: Record<string, unknown>) {
    const response = await adminFetch<Booking>("/api/admin/counselling", {
      method: "PATCH",
      body: JSON.stringify({ id: booking.id, ...body }),
    });
    if (!response.success || !response.data) {
      showToast(response.message || "Could not update the session.", true);
      return null;
    }
    // Payment actions can change the status on the server; keep the select in
    // sync without touching other fields the admin may still be editing.
    setStatus(response.data.status);
    await onChanged(response.data);
    return response.data;
  }

  function formFields() {
    return {
      status,
      scheduledAt: fromDhakaDateTimeInput(scheduledAt),
      meetingLink: meetingLink.trim() || null,
      counsellorNotes: counsellorNotes.trim() || null,
      paymentNote: paymentNote.trim() || null,
    };
  }

  async function save() {
    const fee = sessionFee.trim() ? Number(sessionFee) : null;
    if (fee != null && (!Number.isInteger(fee) || fee < 0)) {
      showToast("Enter a valid whole-number session fee.", true);
      return;
    }
    setSaving(true);

    let sharedNote = "";
    if (files.staged.length) {
      const result = await files.share();
      if (result && result.shared === 0) {
        showToast(result.message, true);
        setSaving(false);
        return;
      }
      if (result && !result.ok) showToast(result.message, true);
      if (result) sharedNote = ` ${result.shared} file${result.shared === 1 ? "" : "s"} shared.`;
    }

    const updated = await patch({ ...formFields(), sessionFee: fee });
    setSaving(false);
    if (updated) showToast(`Session saved.${sharedNote}`);
    else if (sharedNote) await onRefresh();
  }

  async function paymentAction(action: "mark_paid" | "waive" | "reopen_payment") {
    setActionLoading(action);
    const updated = await patch({ paymentAction: action, paymentNote: paymentNote.trim() || null });
    setActionLoading("");
    if (updated) {
      showToast(
        action === "mark_paid"
          ? "Payment marked as verified."
          : action === "waive"
            ? "Session fee waived."
            : "Payment reopened. The student can submit proof again.",
      );
    }
  }

  async function markPaidAndConfirm() {
    setActionLoading("mark_paid_and_confirm");
    const updated = await patch({ ...formFields(), paymentAction: "mark_paid", status: "CONFIRMED" });
    setActionLoading("");
    if (updated) {
      setStatus("CONFIRMED");
      showToast("Payment verified and session confirmed. The student can now share documents.");
    }
  }

  async function archiveAction(action: "archive" | "restore") {
    setActionLoading(action);
    const updated = await patch({ archiveAction: action });
    setActionLoading("");
    if (updated) {
      showToast(action === "archive" ? "Session archived." : "Session restored.");
      onClosed();
    }
  }

  function addFiles(list: FileList | null) {
    for (const problem of files.add(list)) showToast(problem, true);
  }

  const confirmedWithoutTime = status === "CONFIRMED" && !scheduledAt;

  return (
    <div className="p-5 pt-14 sm:p-7 sm:pt-14">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <AdminBadge variant={statusVariant[booking.status]}>{booking.status}</AdminBadge>
            <AdminBadge variant={paymentVariant[booking.paymentStatus]}>
              {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
            </AdminBadge>
            {archived ? <AdminBadge variant="warning">Archived</AdminBadge> : null}
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-navy">{booking.fullName}</h2>
          <p className="mt-1 text-sm text-slate-500">
            <a href={`tel:${booking.phone}`} className="font-medium text-navy hover:text-accent">
              {booking.phone}
            </a>{" "}
            ·{" "}
            <a href={`mailto:${booking.email}`} className="hover:text-accent">
              {booking.email}
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {archived ? (
            <AdminButton
              variant="ghost"
              isLoading={actionLoading === "restore"}
              onClick={() => void archiveAction("restore")}
            >
              <RotateCcw className="h-4 w-4" /> Restore
            </AdminButton>
          ) : ["COMPLETED", "CANCELLED"].includes(booking.status) ? (
            <AdminButton
              variant="ghost"
              isLoading={actionLoading === "archive"}
              onClick={() => void archiveAction("archive")}
            >
              <Archive className="h-4 w-4" /> Archive
            </AdminButton>
          ) : null}
          {archived && canPermanentlyDelete ? (
            <AdminButton variant="danger" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </AdminButton>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            <Detail icon={UserRound} label="Class" value={booking.educationLevel} />
            <Detail label="Class roll" value={booking.classRoll || "—"} />
            <Detail label="School" value={booking.schoolName || "—"} />
            <Detail label="Group" value={booking.studentGroup || "—"} />
            <Detail icon={CalendarClock} label="Submission date" value={formatAdminDate(booking.createdAt)} />
            <Detail
              label="Session time"
              value={formatSessionDateTime(booking.scheduledAt) ?? "Not scheduled yet"}
            />
          </div>

          {booking.message ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Student&apos;s problems</p>
              <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                {booking.message}
              </p>
            </div>
          ) : null}

          <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-navy">Session management</h3>
              {booking.paymentStatus === "PAID" ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  Payment verified
                </span>
              ) : null}
            </div>

            {booking.paymentStatus === "PAID" && status === "PENDING" ? (
              <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">Payment is verified!</p>
                  <p className="mt-0.5 text-emerald-800/80">
                    Confirm the session, set its time and add the meeting link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus("CONFIRMED")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Set Confirmed
                </button>
              </div>
            ) : null}

            <AdminField
              label="Session status"
              hint={
                status === "CONFIRMED"
                  ? "Confirmed sessions let the student share documents."
                  : "The student can share documents once you confirm the session."
              }
            >
              <AdminSelect value={status} onChange={(event) => setStatus(event.target.value as BookingStatus)}>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </AdminSelect>
            </AdminField>
            <AdminField
              label="Session date & time"
              hint="Bangladesh time. The student gets a notification and an email when you set or change it."
            >
              <div className="flex gap-2">
                <AdminInput
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  invalid={confirmedWithoutTime}
                />
                {scheduledAt ? (
                  <AdminButton type="button" variant="ghost" onClick={() => setScheduledAt("")}>
                    Clear
                  </AdminButton>
                ) : null}
              </div>
            </AdminField>
            {confirmedWithoutTime ? (
              <p className="-mt-2 text-xs text-amber-700">
                Add the session time so the family knows when to join.
              </p>
            ) : null}
            <AdminField label="Meeting link">
              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <AdminInput className="pl-9" type="url" value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} placeholder="https://meet.google.com/..." />
              </div>
            </AdminField>
            <AdminField label="Counsellor notes visible to student">
              <AdminTextarea rows={4} value={counsellorNotes} onChange={(event) => setCounsellorNotes(event.target.value)} />
            </AdminField>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-navy">Payment</h3>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <AdminField label="Session fee (৳)" hint="Setting a fee asks the student to pay with bKash.">
                <AdminInput type="number" min={0} step={1} value={sessionFee} onChange={(event) => setSessionFee(event.target.value)} />
              </AdminField>
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="text-xs text-slate-400">Current status</p>
                <p className="mt-1 font-semibold text-navy">{PAYMENT_STATUS_LABELS[booking.paymentStatus]}</p>
              </div>
            </div>
            {(booking.bkashSenderNumber || booking.bkashTransactionId) ? (
              <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2">
                <Detail label="Sender number" value={booking.bkashSenderNumber || "—"} />
                <Detail label="Transaction ID" value={booking.bkashTransactionId || "—"} />
              </div>
            ) : null}
            {booking.hasPaymentProof ? (
              <a
                href={`/api/admin/counselling/${booking.id}/payment-proof`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
              >
                <ExternalLink className="h-4 w-4" /> View payment proof
              </a>
            ) : null}
            <AdminField label="Internal payment note" hint="Only staff can see this." className="mt-4">
              <AdminTextarea rows={2} value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} />
            </AdminField>
            {!archived ? <div className="mt-4 flex flex-wrap gap-2">
              {booking.paymentStatus === "PROOF_SUBMITTED" ? (
                <>
                  <AdminButton size="sm" isLoading={actionLoading === "mark_paid"} onClick={() => void paymentAction("mark_paid")}>
                    <CheckCircle2 className="h-4 w-4" /> Mark paid
                  </AdminButton>
                  <AdminButton
                    size="sm"
                    variant="primary"
                    isLoading={actionLoading === "mark_paid_and_confirm"}
                    onClick={() => void markPaidAndConfirm()}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark paid & confirm
                  </AdminButton>
                </>
              ) : null}
              {!["PAID", "WAIVED"].includes(booking.paymentStatus) ? (
                <AdminButton size="sm" variant="ghost" isLoading={actionLoading === "waive"} onClick={() => void paymentAction("waive")}>
                  Waive fee
                </AdminButton>
              ) : null}
              {["PROOF_SUBMITTED", "PAID"].includes(booking.paymentStatus) ? (
                <AdminButton size="sm" variant="ghost" isLoading={actionLoading === "reopen_payment"} onClick={() => void paymentAction("reopen_payment")}>
                  Reopen payment
                </AdminButton>
              ) : null}
            </div> : null}
          </div>

          <AdminSessionFiles
            bookingId={booking.id}
            status={booking.status}
            archived={archived}
            files={booking.files}
            staged={files.staged}
            sharing={files.sharing}
            onAdd={addFiles}
            onRemoveStaged={files.remove}
            onDeleted={onRefresh}
            showToast={showToast}
          />
        </div>
      </div>

      {!archived ? (
        <div className="sticky bottom-0 -mx-5 mt-6 flex justify-end border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-7 sm:px-7">
          <AdminButton isLoading={saving} onClick={() => void save()}>
            <Save className="h-4 w-4" />
            {files.staged.length
              ? `Save changes & share ${files.staged.length} file${files.staged.length > 1 ? "s" : ""}`
              : "Save changes"}
          </AdminButton>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof Clock; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-navy">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function TabButton({ active, label, count, icon: Icon, onClick }: { active: boolean; label: string; count: number; icon: typeof Inbox; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? "bg-navy text-white shadow-sm" : "text-slate-600 hover:bg-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15" : "bg-slate-200/70"}`}>
        {count.toLocaleString()}
      </span>
    </button>
  );
}

function Detail({ icon: Icon, label, value }: { icon?: typeof UserRound; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> : null}
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-navy">{value}</p>
      </div>
    </div>
  );
}
