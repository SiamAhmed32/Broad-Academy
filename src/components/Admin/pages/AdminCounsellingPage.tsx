"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Inbox,
  Link as LinkIcon,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
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
import Modal from "@/components/reusables/Modal";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";
import { PAYMENT_STATUS_LABELS } from "@/lib/counselling/payment";

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
  subjectInterest: string;
  preferredDate: string;
  preferredTime: string;
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
  const { showToast, ToastViewport } = useAdminToast();
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

  const loadBookings = useCallback(async () => {
    setLoading(true);
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
    } else {
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
              placeholder="Search name, email, phone, subject or transaction ID..."
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
          <AdminSelect value={subject} onChange={(event) => { setSubject(event.target.value); setPage(1); }}>
            <option value="">All subjects</option>
            {filters.subjects.map((item) => <option key={item} value={item}>{item}</option>)}
          </AdminSelect>
          <AdminSelect value={educationLevel} onChange={(event) => { setEducationLevel(event.target.value); setPage(1); }}>
            <option value="">All education levels</option>
            {filters.educationLevels.map((item) => <option key={item} value={item}>{item}</option>)}
          </AdminSelect>
          <AdminInput type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} aria-label="Session date from" />
          <AdminInput type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} aria-label="Session date to" />
          <AdminSelect value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="newest">Newest requests</option>
            <option value="oldest">Oldest requests</option>
            <option value="session-soonest">Session date: soonest</option>
            <option value="session-latest">Session date: latest</option>
            <option value="name-asc">Student name A–Z</option>
          </AdminSelect>
          <AdminButton variant="ghost" onClick={clearFilters}>
            Clear filters
          </AdminButton>
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
                        <p className="max-w-[220px] truncate font-medium text-navy">{booking.subjectInterest}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{booking.educationLevel}</p>
                        <p className="text-xs text-slate-400">
                          {formatAdminDate(booking.preferredDate)} · {booking.preferredTime}
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
            key={`${selected.id}:${selected.updatedAt}`}
            booking={selected}
            canPermanentlyDelete={canPermanentlyDelete}
            onChanged={async (updated) => {
              setSelected(updated);
              await loadBookings();
            }}
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
      {ToastViewport}
    </div>
  );
}

function SessionWorkspace({
  booking,
  canPermanentlyDelete,
  onChanged,
  onClosed,
  onDelete,
  showToast,
}: {
  booking: Booking;
  canPermanentlyDelete: boolean;
  onChanged: (booking: Booking) => Promise<void>;
  onClosed: () => void;
  onDelete: () => void;
  showToast: (message: string, error?: boolean) => void;
}) {
  const [status, setStatus] = useState(booking.status);
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink || "");
  const [counsellorNotes, setCounsellorNotes] = useState(booking.counsellorNotes || "");
  const [sessionFee, setSessionFee] = useState(booking.sessionFee == null ? "" : String(booking.sessionFee));
  const [paymentNote, setPaymentNote] = useState(booking.paymentNote || "");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [uploading, setUploading] = useState(false);

  async function patch(body: Record<string, unknown>, successMessage: string) {
    const response = await adminFetch<Booking>("/api/admin/counselling", {
      method: "PATCH",
      body: JSON.stringify({ id: booking.id, ...body }),
    });
    if (!response.success || !response.data) {
      showToast(response.message || "Could not update the session.", true);
      return false;
    }
    showToast(response.message || successMessage);
    await onChanged(response.data);
    return true;
  }

  async function save() {
    const fee = sessionFee.trim() ? Number(sessionFee) : null;
    if (fee != null && (!Number.isInteger(fee) || fee < 0)) {
      showToast("Enter a valid whole-number session fee.", true);
      return;
    }
    setSaving(true);
    await patch(
      {
        status,
        meetingLink: meetingLink.trim() || null,
        counsellorNotes: counsellorNotes.trim() || null,
        sessionFee: fee,
        paymentNote: paymentNote.trim() || null,
      },
      "Session updated.",
    );
    setSaving(false);
  }

  async function paymentAction(action: "mark_paid" | "waive" | "reopen_payment") {
    setActionLoading(action);
    await patch(
      { paymentAction: action, paymentNote: paymentNote.trim() || null },
      "Payment status updated.",
    );
    setActionLoading("");
  }

  async function archiveAction(action: "archive" | "restore") {
    setActionLoading(action);
    const success = await patch(
      { archiveAction: action },
      action === "archive" ? "Session archived." : "Session restored.",
    );
    setActionLoading("");
    if (success) onClosed();
  }

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("File size must be under 10 MB.", true);
      return;
    }
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`/api/counselling/bookings/${booking.id}/files`, {
      method: "POST",
      body,
      credentials: "same-origin",
    });
    const payload = (await response.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
    } | null;
    setUploading(false);
    if (!response.ok || !payload?.success) {
      showToast(payload?.message || "File upload failed.", true);
      return;
    }
    showToast("File uploaded.");
    await patch({}, "Session refreshed.");
  }

  return (
    <div className="p-5 pt-14 sm:p-7 sm:pt-14">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <AdminBadge variant={statusVariant[booking.status]}>{booking.status}</AdminBadge>
            <AdminBadge variant={paymentVariant[booking.paymentStatus]}>
              {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
            </AdminBadge>
            {booking.archivedAt ? <AdminBadge variant="warning">Archived</AdminBadge> : null}
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-navy">{booking.fullName}</h2>
          <p className="mt-1 text-sm text-slate-500">{booking.email} · {booking.phone}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {booking.archivedAt ? (
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
          {booking.archivedAt && canPermanentlyDelete ? (
            <AdminButton variant="danger" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </AdminButton>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            <Detail icon={UserRound} label="Education" value={booking.educationLevel} />
            <Detail label="Subject" value={booking.subjectInterest} />
            <Detail icon={CalendarClock} label="Preferred date" value={formatAdminDate(booking.preferredDate)} />
            <Detail label="Preferred time" value={booking.preferredTime} />
          </div>

          {booking.message ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Student message</p>
              <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                {booking.message}
              </p>
            </div>
          ) : null}

          <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <h3 className="font-semibold text-navy">Session management</h3>
            <AdminField label="Session status">
              <AdminSelect value={status} onChange={(event) => setStatus(event.target.value as BookingStatus)}>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </AdminSelect>
            </AdminField>
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
              <AdminField label="Session fee (৳)">
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
            <AdminField label="Internal payment note" className="mt-4">
              <AdminTextarea rows={2} value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} />
            </AdminField>
            {!booking.archivedAt ? <div className="mt-4 flex flex-wrap gap-2">
              {booking.paymentStatus === "PROOF_SUBMITTED" ? (
                <AdminButton size="sm" isLoading={actionLoading === "mark_paid"} onClick={() => void paymentAction("mark_paid")}>
                  <CheckCircle2 className="h-4 w-4" /> Mark paid
                </AdminButton>
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

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-navy">Shared files</h3>
              {!booking.archivedAt ? <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-navy hover:bg-slate-50">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload
                <input type="file" className="sr-only" disabled={uploading} onChange={uploadFile} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt,.zip" />
              </label> : null}
            </div>
            {booking.files.length ? (
              <ul className="mt-3 space-y-2">
                {booking.files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy">{file.fileName}</p>
                      <p className="text-xs text-slate-400">{file.uploadedByName} · {formatAdminDate(file.createdAt)}</p>
                    </div>
                    <a href={file.fileUrl} target="_blank" rel="noreferrer" className="ml-3 rounded-lg p-2 text-slate-500 hover:bg-white hover:text-navy">
                      <Download className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">No files shared.</p>
            )}
          </div>
        </div>
      </div>

      {!booking.archivedAt ? (
        <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
          <AdminButton isLoading={saving} onClick={() => void save()}>
            <Save className="h-4 w-4" /> Save changes
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
