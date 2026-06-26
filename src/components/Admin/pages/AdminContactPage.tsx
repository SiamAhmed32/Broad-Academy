"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  CheckCircle2,
  Eye,
  Inbox,
  Mail,
  RotateCcw,
  Search,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
} from "@/components/Admin";
import Modal from "@/components/reusables/Modal";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";

type MessageStatus = "NEW" | "READ" | "ARCHIVED";

type Message = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  subject: string;
  message: string;
  source: string;
  status: MessageStatus;
  createdAt: string;
};

const statusVariant = {
  NEW: "info" as const,
  READ: "muted" as const,
  ARCHIVED: "warning" as const,
};

const statusLabel = {
  NEW: "Unread",
  READ: "Read",
  ARCHIVED: "Archived",
};

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

export default function AdminContactPage() {
  const shouldReduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(emptyPagination);
  const [counts, setCounts] = useState({ NEW: 0, READ: 0, ARCHIVED: 0 });

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(emptyPagination.limit),
      sort,
    });
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);

    const res = await adminFetch<{
      messages: Message[];
      counts: typeof counts;
      pagination: AdminPaginationMeta;
    }>(`/api/admin/contact?${params}`);

    if (res.success && res.data) {
      setMessages(res.data.messages);
      setCounts(res.data.counts);
      setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [page, search, sort, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadMessages();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadMessages]);

  async function updateStatus(nextStatus: MessageStatus) {
    if (!selected) return;
    setUpdating(true);
    const result = await adminFetch<Message>("/api/admin/contact", {
      method: "PATCH",
      body: JSON.stringify({ id: selected.id, status: nextStatus }),
    });
    setUpdating(false);
    if (result.success && result.data) {
      setSelected(result.data);
      await loadMessages();
    }
  }

  async function openMessage(message: Message) {
    setSelected(message);
    if (message.status === "NEW") {
      const result = await adminFetch<Message>("/api/admin/contact", {
        method: "PATCH",
        body: JSON.stringify({ id: message.id, status: "READ" }),
      });
      if (result.success && result.data) {
        setSelected(result.data);
        await loadMessages();
      }
    }
  }

  const totalMessages = counts.NEW + counts.READ + counts.ARCHIVED;

  return (
    <div>
      <AdminPageHeader
        title="Contact messages"
        description="Search and manage website enquiries. Archived messages remain available and can be restored."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Unread" value={counts.NEW} icon={Inbox} accent="text-sky-600" />
        <StatCard label="Read" value={counts.READ} icon={CheckCircle2} accent="text-emerald-600" />
        <StatCard label="Archived" value={counts.ARCHIVED} icon={Archive} accent="text-amber-600" />
      </div>

      <AdminCard className="overflow-hidden p-0">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <AdminInput
                className="pl-10"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, subject, phone or message..."
              />
            </div>
            <AdminSelect
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">All statuses ({totalMessages})</option>
              <option value="NEW">Unread ({counts.NEW})</option>
              <option value="READ">Read ({counts.READ})</option>
              <option value="ARCHIVED">Archived ({counts.ARCHIVED})</option>
            </AdminSelect>
            <AdminSelect
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              aria-label="Sort messages"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name-asc">Name A–Z</option>
              <option value="subject-asc">Subject A–Z</option>
            </AdminSelect>
          </div>
        </div>

        {loading ? (
          <AdminLoading label="Loading contact messages..." />
        ) : messages.length === 0 ? (
          <AdminEmpty
            title="No messages found"
            description="Try changing your search or status filter."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-navy">Sender</th>
                    <th className="px-5 py-3 font-semibold text-navy">Subject</th>
                    <th className="px-5 py-3 font-semibold text-navy">Status</th>
                    <th className="px-5 py-3 font-semibold text-navy">Received</th>
                    <th className="px-5 py-3 text-right font-semibold text-navy">View</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message, index) => (
                    <motion.tr
                      key={message.id}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/70 ${
                        message.status === "NEW" ? "bg-sky-50/35" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-navy">{message.fullName}</div>
                        <div className="mt-0.5 max-w-[230px] truncate text-xs text-slate-500">
                          {message.email}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="max-w-[280px] truncate font-medium text-navy">
                          {message.subject}
                        </div>
                        <div className="mt-0.5 max-w-[280px] truncate text-xs text-slate-500">
                          {message.message}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <AdminBadge variant={statusVariant[message.status]}>
                          {statusLabel[message.status]}
                        </AdminBadge>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {formatAdminDate(message.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void openMessage(message)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-navy transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                          aria-label={`View message from ${message.fullName}`}
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
        title="Contact message details"
        size="lg"
      >
        {selected ? (
          <div className="p-6 sm:p-7">
            <div className="pr-10">
              <div className="flex flex-wrap items-center gap-2">
                <AdminBadge variant={statusVariant[selected.status]}>
                  {statusLabel[selected.status]}
                </AdminBadge>
                <span className="text-xs text-slate-400">
                  {formatAdminDate(selected.createdAt)}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy">
                {selected.subject}
              </h2>
            </div>

            <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
              <Detail icon={UserRound} label="Sender" value={selected.fullName} />
              <Detail icon={Mail} label="Email" value={selected.email} href={`mailto:${selected.email}`} />
              <Detail label="Phone" value={selected.phone || "Not provided"} href={selected.phone ? `tel:${selected.phone}` : undefined} />
              <Detail label="Role" value={selected.role} />
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Message
              </p>
              <p className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-700">
                {selected.message}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
              {selected.status === "ARCHIVED" ? (
                <AdminButton
                  variant="ghost"
                  isLoading={updating}
                  onClick={() => void updateStatus("READ")}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore to inbox
                </AdminButton>
              ) : (
                <AdminButton
                  variant="ghost"
                  isLoading={updating}
                  onClick={() => void updateStatus("ARCHIVED")}
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </AdminButton>
              )}
              <a
                href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                <Mail className="h-4 w-4" />
                Reply by email
              </a>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Inbox;
  accent: string;
}) {
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

function Detail({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon?: typeof UserRound;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> : null}
      <span>
        <span className="block text-xs text-slate-400">{label}</span>
        <span className="mt-0.5 block break-all text-sm font-medium text-navy">{value}</span>
      </span>
    </>
  );

  return href ? (
    <a href={href} className="flex gap-2 rounded-xl p-2 transition hover:bg-white">
      {content}
    </a>
  ) : (
    <div className="flex gap-2 p-2">{content}</div>
  );
}
