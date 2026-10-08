"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, MessageSquareReply, Paperclip, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import {
  AdminButton,
  AdminField,
  AdminSelect,
  AdminTextarea,
} from "@/components/Admin";

type DocumentStatus = "PENDING" | "REVIEWED" | "APPROVED" | "REJECTED";

type ReplyTarget = {
  id: string;
  fullName: string;
  documentType: string;
  status: DocumentStatus;
  reviewNote: string | null;
  replyFileUrl: string | null;
  replyFileName: string | null;
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const statusOptions: Array<{ value: DocumentStatus; label: string }> = [
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected (needs attention)" },
];

export default function DocumentReplyDialog({
  document,
  onClose,
  onSaved,
}: {
  document: ReplyTarget | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [saving, setSaving] = useState(false);

  return (
    <AnimatePresence>
      {document ? (
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
            aria-labelledby="document-reply-title"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <ReplyForm
              key={document.id}
              document={document}
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

function ReplyForm({
  document,
  saving,
  setSaving,
  onClose,
  onSaved,
}: {
  document: ReplyTarget;
  saving: boolean;
  setSaving: (value: boolean) => void;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<DocumentStatus>(
    document.status === "PENDING" ? "REVIEWED" : document.status,
  );
  const [note, setNote] = useState(document.reviewNote ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [error, setError] = useState("");

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    if (!selected) return;
    if (selected.size > MAX_FILE_BYTES) {
      setError("Attachment must be 8 MB or smaller.");
      return;
    }
    if (!ALLOWED_TYPES.has(selected.type)) {
      setError("Attach a JPG, PNG, WebP, or PDF file.");
      return;
    }
    setFile(selected);
  };

  const save = async () => {
    if (!note.trim() && !file && (!document.replyFileUrl || removeExisting)) {
      setError("Write a reply or attach a file for the student.");
      return;
    }

    const formData = new FormData();
    formData.append("status", status);
    formData.append("reviewNote", note.trim());
    formData.append("removeFile", removeExisting ? "1" : "0");
    if (file) formData.append("file", file);

    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/documents/${document.id}/reply`, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;
      if (!response.ok || !payload?.success) {
        setError(payload?.message ?? "Could not save the reply.");
        return;
      }
      await onSaved();
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const showExisting = document.replyFileUrl && !removeExisting && !file;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <MessageSquareReply className="h-5 w-5" />
          </div>
          <div>
            <h2 id="document-reply-title" className="text-lg font-semibold text-navy">
              Reply to {document.fullName}
            </h2>
            <p className="text-sm text-slate-500">{document.documentType}</p>
          </div>
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
        <AdminField label="Status">
          <AdminSelect
            value={status}
            onChange={(e) => setStatus(e.target.value as DocumentStatus)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminSelect>
        </AdminField>

        <AdminField
          label="Reply to the student"
          hint="The student sees this on their Submit Documents page."
        >
          <AdminTextarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="Write feedback, the solution, or next steps..."
          />
        </AdminField>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-navy">
            Attachment (optional)
          </span>
          {showExisting ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm">
              <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-navy">
                {document.replyFileName ?? "Current attachment"}
              </span>
              <a
                href={`/api/admin/documents/${document.id}/file?which=reply`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 hover:text-accent"
                aria-label="Open attachment"
              >
                <Eye className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setRemoveExisting(true)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-4 text-sm font-medium text-navy transition hover:border-accent/40 hover:bg-slate-50"
          >
            {file ? (
              <>
                <Paperclip className="h-4 w-4 text-accent" />
                <span className="truncate">{file.name}</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-slate-400" />
                {document.replyFileUrl ? "Replace with a new file" : "Attach a PDF or image"}
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onFileChange}
          />
          <p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG or WebP up to 8 MB.</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AdminButton variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </AdminButton>
        <AdminButton onClick={() => void save()} isLoading={saving}>
          Send reply
        </AdminButton>
      </div>
    </>
  );
}
