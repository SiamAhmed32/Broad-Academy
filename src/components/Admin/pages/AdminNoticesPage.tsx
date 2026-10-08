"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Megaphone, Pencil, Pin, Plus, Trash2, X } from "lucide-react";
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
  AdminTextarea,
  useAdminToast,
} from "@/components/Admin";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";

type Notice = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
  pinned: boolean;
  published: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

type NoticeForm = {
  title: string;
  body: string;
  linkUrl: string;
  linkLabel: string;
  pinned: boolean;
  published: boolean;
  notifyStudents: boolean;
};

const emptyForm: NoticeForm = {
  title: "",
  body: "",
  linkUrl: "",
  linkLabel: "",
  pinned: false,
  published: true,
  notifyStudents: true,
};

function toPayload(form: NoticeForm) {
  return {
    title: form.title,
    body: form.body,
    linkUrl: form.linkUrl || null,
    linkLabel: form.linkLabel || null,
    pinned: form.pinned,
    published: form.published,
    notifyStudents: form.notifyStudents,
  };
}

function noticeToForm(notice: Notice): NoticeForm {
  return {
    title: notice.title,
    body: notice.body,
    linkUrl: notice.linkUrl ?? "",
    linkLabel: notice.linkLabel ?? "",
    pinned: notice.pinned,
    published: notice.published,
    notifyStudents: !notice.published,
  };
}

export default function AdminNoticesPage() {
  const { showToast } = useAdminToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Notice | "new" | null>(null);
  const [deleting, setDeleting] = useState<Notice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch<{ notices: Notice[] }>("/api/admin/notices");
    if (res.success && res.data) setNotices(res.data.notices);
    else showToast(res.message ?? "Could not load notices.", true);
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    let cancelled = false;
    adminFetch<{ notices: Notice[] }>("/api/admin/notices").then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setNotices(res.data.notices);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const togglePublished = async (notice: Notice) => {
    const res = await adminFetch(`/api/admin/notices/${notice.id}`, {
      method: "PATCH",
      body: JSON.stringify(
        toPayload({
          ...noticeToForm(notice),
          published: !notice.published,
          notifyStudents: !notice.published,
        }),
      ),
    });
    if (res.success) {
      showToast(notice.published ? "Notice hidden from students." : "Notice published.");
      await load();
    } else {
      showToast(res.message ?? "Could not update notice.", true);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    const res = await adminFetch(`/api/admin/notices/${deleting.id}`, {
      method: "DELETE",
    });
    setIsDeleting(false);
    if (res.success) {
      showToast("Notice deleted.");
      setDeleting(null);
      await load();
    } else {
      showToast(res.message ?? "Could not delete notice.", true);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Academy Notices"
        description="Official updates students see on their dashboard under Academy notices. New notices can also be sent to every student's notification bell."
        actions={
          <AdminButton onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> New notice
          </AdminButton>
        }
      />

      {loading ? (
        <AdminLoading label="Loading notices..." />
      ) : notices.length === 0 ? (
        <AdminEmpty
          title="No notices yet"
          description="Create the first notice to share an official update with students."
        />
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <AdminCard key={notice.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-navy">{notice.title}</h3>
                    {notice.pinned ? (
                      <AdminBadge variant="info">
                        <Pin className="mr-1 inline h-3 w-3" />
                        Pinned
                      </AdminBadge>
                    ) : null}
                    <AdminBadge variant={notice.published ? "success" : "warning"}>
                      {notice.published ? "Published" : "Hidden"}
                    </AdminBadge>
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {notice.body}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>Published {formatAdminDate(notice.publishedAt)}</span>
                    {notice.linkUrl ? (
                      <a
                        href={notice.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {notice.linkLabel || "Link"}
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <AdminButton variant="ghost" size="sm" onClick={() => void togglePublished(notice)}>
                    {notice.published ? "Hide" : "Publish"}
                  </AdminButton>
                  <AdminButton variant="ghost" size="sm" onClick={() => setEditing(notice)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleting(notice)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </AdminButton>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <NoticeEditor
        notice={editing}
        onClose={() => setEditing(null)}
        onSaved={async (message) => {
          showToast(message);
          setEditing(null);
          await load();
        }}
      />

      <AdminConfirmDialog
        open={Boolean(deleting)}
        title="Delete this notice?"
        description="Students will no longer see it. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function NoticeEditor({
  notice,
  onClose,
  onSaved,
}: {
  notice: Notice | "new" | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [saving, setSaving] = useState(false);

  return (
    <AnimatePresence>
      {notice ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm"
          onClick={saving ? undefined : onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-editor-title"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <NoticeForm
              key={notice === "new" ? "new" : notice.id}
              notice={notice}
              saving={saving}
              setSaving={setSaving}
              onClose={onClose}
              onSaved={onSaved}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function NoticeForm({
  notice,
  saving,
  setSaving,
  onClose,
  onSaved,
}: {
  notice: Notice | "new";
  saving: boolean;
  setSaving: (value: boolean) => void;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [form, setForm] = useState<NoticeForm>(() =>
    notice === "new" ? emptyForm : noticeToForm(notice),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const isNew = notice === "new";
  const wasPublished = notice !== "new" && notice.published;

  const update = <K extends keyof NoticeForm>(key: K, value: NoticeForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    setFormError("");
    const res = await adminFetch(
      isNew ? "/api/admin/notices" : `/api/admin/notices/${notice.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(toPayload(form)),
      },
    );
    setSaving(false);

    if (!res.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(res.fields ?? {})) {
        if (messages?.[0]) fieldErrors[field] = messages[0];
      }
      setErrors(fieldErrors);
      setFormError(res.message ?? "Could not save the notice.");
      return;
    }
    await onSaved(isNew ? "Notice created." : "Notice saved.");
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Megaphone className="h-5 w-5" />
          </div>
          <h2 id="notice-editor-title" className="text-lg font-semibold text-navy">
            {isNew ? "New notice" : "Edit notice"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <AdminField label="Title" error={errors.title}>
          <AdminInput
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. SSC model test schedule published"
            maxLength={160}
            invalid={Boolean(errors.title)}
          />
        </AdminField>
        <AdminField label="Details" error={errors.body}>
          <AdminTextarea
            value={form.body}
            onChange={(e) => update("body", e.target.value)}
            rows={7}
            placeholder="Write the full notice. Line breaks are kept."
            maxLength={5000}
            invalid={Boolean(errors.body)}
          />
        </AdminField>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Link (optional)"
            hint="https://... or a page like /courses"
            error={errors.linkUrl}
          >
            <AdminInput
              value={form.linkUrl}
              onChange={(e) => update("linkUrl", e.target.value)}
              placeholder="https://"
              invalid={Boolean(errors.linkUrl)}
            />
          </AdminField>
          <AdminField label="Link button text" error={errors.linkLabel}>
            <AdminInput
              value={form.linkLabel}
              onChange={(e) => update("linkLabel", e.target.value)}
              placeholder="e.g. View routine"
              maxLength={60}
            />
          </AdminField>
        </div>

        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Checkbox
            checked={form.published}
            onChange={(value) => update("published", value)}
            label="Visible to students"
          />
          <Checkbox
            checked={form.pinned}
            onChange={(value) => update("pinned", value)}
            label="Pin to the top"
          />
          {form.published && !wasPublished ? (
            <Checkbox
              checked={form.notifyStudents}
              onChange={(value) => update("notifyStudents", value)}
              label="Send to every student's notification bell"
            />
          ) : null}
        </div>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AdminButton variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </AdminButton>
        <AdminButton onClick={() => void save()} isLoading={saving}>
          {isNew ? "Create notice" : "Save changes"}
        </AdminButton>
      </div>
    </>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-accent"
      />
      {label}
    </label>
  );
}
