"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Download,
  Eye,
  MessageSquareReply,
  Paperclip,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  AdminButton,
  AdminField,
  AdminSelect,
  AdminTextarea,
} from "@/components/Admin";
import { apiFetch } from "@/lib/api/client";
import { DOCUMENT_ACCEPT, documentFileProblem } from "@/lib/documents/files";
import type { DirectUploadResult } from "@/lib/media/direct-upload";
import { formatFileSize } from "@/lib/media/file-size";
import { previewLocalFile } from "@/lib/media/preview-local-file";
import { uploadOneDirect } from "@/lib/media/upload-one-client";

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
  // Kept so a retry after a failed save does not upload the same file again.
  const [uploaded, setUploaded] = useState<{ file: File; upload: DirectUploadResult } | null>(
    null,
  );
  const [status, setStatus] = useState<DocumentStatus>(
    document.status === "PENDING" ? "REVIEWED" : document.status,
  );
  const [note, setNote] = useState(document.reviewNote ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [error, setError] = useState("");

  const existingName = document.replyFileName ?? "Current attachment";
  const fileUrl = `/api/admin/documents/${document.id}/file?which=reply`;

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    // Lets the same file be chosen again after removing it.
    event.target.value = "";
    setError("");
    if (!selected) return;
    const problem = documentFileProblem(selected);
    if (problem) {
      setError(problem);
      return;
    }
    setFile(selected);
  };

  const save = async () => {
    const keepsExisting = Boolean(document.replyFileUrl) && !removeExisting;
    if (!note.trim() && !file && !keepsExisting) {
      setError("Write a reply or attach a file for the student.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      let attachment: { fileName: string; upload: DirectUploadResult } | null = null;
      if (file) {
        let upload = uploaded?.file === file ? uploaded.upload : null;
        if (!upload) {
          setUploadPercent(0);
          upload = await uploadOneDirect(
            `/api/admin/documents/${document.id}/reply/sign`,
            file,
            setUploadPercent,
          );
          setUploaded({ file, upload });
          setUploadPercent(null);
        }
        attachment = { fileName: file.name, upload };
      }

      const result = await apiFetch(`/api/admin/documents/${document.id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          status,
          reviewNote: note.trim(),
          removeFile: removeExisting,
          attachment,
        }),
      });
      if (!result.success) {
        // A rejected attachment is deleted on the server, so upload it afresh.
        if (result.status === 422 || result.status === 404) setUploaded(null);
        setError(result.message ?? "Could not save the reply.");
        return;
      }
      await onSaved();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The attachment could not be uploaded. Please try again.",
      );
    } finally {
      setUploadPercent(null);
      setSaving(false);
    }
  };

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

          {document.replyFileUrl && !file ? (
            removeExisting ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-red-200 bg-red-50/60 px-3.5 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate text-red-700">
                  &ldquo;{existingName}&rdquo; will be removed when you send.
                </span>
                <button
                  type="button"
                  onClick={() => setRemoveExisting(false)}
                  disabled={saving}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-navy hover:underline"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Undo
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-navy" title={existingName}>
                  {existingName}
                </span>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md p-1 text-slate-500 hover:text-accent"
                  aria-label="Open attachment"
                  title="Open"
                >
                  <Eye className="h-4 w-4" />
                </a>
                <a
                  href={`${fileUrl}&download=1`}
                  className="rounded-md p-1 text-slate-500 hover:text-accent"
                  aria-label="Download attachment"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setRemoveExisting(true)}
                  disabled={saving}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            )
          ) : null}

          {file ? (
            <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm">
              <Paperclip className="h-4 w-4 shrink-0 text-accent" />
              <span className="min-w-0 flex-1 truncate text-navy" title={file.name}>
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-slate-500">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => previewLocalFile(file)}
                className="rounded-md p-1 text-slate-500 hover:text-accent"
                aria-label="Preview the new attachment"
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={saving}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : null}

          {file && document.replyFileUrl && !removeExisting ? (
            <p className="mt-1.5 text-xs text-slate-500">
              This replaces &ldquo;{existingName}&rdquo; when you send.
            </p>
          ) : null}

          {uploadPercent !== null ? (
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Uploading attachment"
              aria-valuenow={uploadPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-4 text-sm font-medium text-navy transition hover:border-accent/40 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4 text-slate-400" />
            {file
              ? "Choose a different file"
              : document.replyFileUrl && !removeExisting
                ? "Replace with a new file"
                : "Attach a PDF or image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={DOCUMENT_ACCEPT}
            className="sr-only"
            onChange={onFileChange}
          />
          <p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG or WebP up to 8 MB.</p>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AdminButton variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </AdminButton>
        <AdminButton onClick={() => void save()} isLoading={saving}>
          {uploadPercent !== null
            ? `Uploading ${uploadPercent}%`
            : saving
              ? "Sending..."
              : "Send reply"}
        </AdminButton>
      </div>
    </>
  );
}
