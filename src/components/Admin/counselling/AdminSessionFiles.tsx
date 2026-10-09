"use client";

import { AlertTriangle, Download, Eye, Lock, LockOpen, Paperclip, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";

import { AdminConfirmDialog } from "@/components/Admin/ui/AdminConfirmDialog";
import { formatAdminDate } from "@/lib/admin/client";
import { COUNSELLING_FILE_ACCEPT, COUNSELLING_FILE_HINT } from "@/lib/counselling/files";
import { removeCounsellingFile } from "@/lib/counselling/share-files-client";
import type { StagedFile } from "@/lib/counselling/use-staged-files";
import { formatFileSize } from "@/lib/media/file-size";
import { previewLocalFile } from "@/lib/media/preview-local-file";

type SharedFile = {
  id: string;
  fileName: string;
  uploadedByRole: string;
  uploadedByName: string;
  createdAt: string;
};

export default function AdminSessionFiles({
  bookingId,
  status,
  archived,
  files,
  staged,
  sharing,
  onAdd,
  onRemoveStaged,
  onDeleted,
  showToast,
}: {
  bookingId: string;
  status: string;
  archived: boolean;
  files: SharedFile[];
  staged: StagedFile[];
  sharing: boolean;
  onAdd: (files: FileList | null) => void;
  onRemoveStaged: (key: string) => void;
  onDeleted: () => Promise<void>;
  showToast: (message: string, error?: boolean) => void;
}) {
  const [deleteTarget, setDeleteTarget] = useState<SharedFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const studentUploadsOpen = status === "CONFIRMED" && !archived;
  const sharedNames = new Set(files.map((file) => file.fileName.toLowerCase()));

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await removeCounsellingFile(bookingId, deleteTarget.id);
    setDeleting(false);
    if (!result.ok) {
      showToast(result.message, true);
      return;
    }
    showToast(`"${deleteTarget.fileName}" removed.`);
    setDeleteTarget(null);
    await onDeleted();
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-navy">Shared files</h3>
        {!archived ? (
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-navy hover:bg-slate-50">
            <Upload className="h-3.5 w-3.5" />
            Add files
            <input
              type="file"
              multiple
              className="sr-only"
              disabled={sharing}
              accept={COUNSELLING_FILE_ACCEPT}
              onChange={(event) => {
                onAdd(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>

      <p
        className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs leading-5 ${
          studentUploadsOpen ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"
        }`}
      >
        {studentUploadsOpen ? (
          <LockOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        ) : (
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        )}
        {studentUploadsOpen
          ? "The student can share documents now (session confirmed)."
          : "The student can share documents only after you confirm the session."}
      </p>

      {staged.length ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <p className="text-xs font-semibold text-amber-800">
            Not shared yet — click Save changes to share {staged.length === 1 ? "this file" : "these files"}.
          </p>
          <ul className="mt-2 space-y-2">
            {staged.map((item) => (
              <li key={item.key} className="rounded-lg bg-white p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Paperclip className="h-4 w-4 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy">{item.file.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(item.file.size)}
                        {sharedNames.has(item.file.name.toLowerCase()) ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="h-3 w-3" /> A file with this name is already shared
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  {!sharing ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => previewLocalFile(item.file)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-navy"
                        aria-label={`Preview ${item.file.name}`}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveStaged(item.key)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.file.name}`}
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
                {item.percent !== null ? (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-accent transition-[width]"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {files.length ? (
        <ul className="mt-3 space-y-2">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
              <div className="min-w-0">
                <a
                  href={`/api/counselling/bookings/${bookingId}/files/${file.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm font-medium text-navy hover:text-accent hover:underline"
                  title="Open"
                >
                  {file.fileName}
                </a>
                <p className="text-xs text-slate-400">
                  {file.uploadedByRole === "STUDENT" ? "Student" : "Team"} · {file.uploadedByName} ·{" "}
                  {formatAdminDate(file.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={`/api/counselling/bookings/${bookingId}/files/${file.id}?download=1`}
                  className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-navy"
                  aria-label={`Download ${file.fileName}`}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
                {!archived ? (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(file)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${file.fileName}`}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : staged.length ? null : (
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
          No files shared yet. {COUNSELLING_FILE_HINT}.
        </p>
      )}

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title="Remove this file?"
        description={`"${deleteTarget?.fileName ?? ""}" will be removed for both you and the student. This cannot be undone.`}
        confirmLabel="Remove file"
        variant="danger"
        isLoading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
