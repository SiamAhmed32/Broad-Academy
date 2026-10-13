"use client";

import {
  Download,
  FileText,
  Loader2,
  Lock,
  Paperclip,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  COUNSELLING_FILE_ACCEPT,
  COUNSELLING_FILE_HINT,
  studentCanShareFiles,
} from "@/lib/counselling/files";
import { removeCounsellingFile } from "@/lib/counselling/share-files-client";
import { useStagedFiles } from "@/lib/counselling/use-staged-files";
import { formatFileSize } from "@/lib/media/file-size";
import type { CounsellingBookingSummary } from "@/lib/student/types";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

function lockedMessage(booking: CounsellingBookingSummary) {
  if (booking.archived || booking.status === "COMPLETED") {
    return "This session is finished, so new documents can't be added. Contact us if you need to share something.";
  }
  if (booking.status === "CANCELLED") return "This request was cancelled.";
  return "You can share documents once our team has reviewed your request, spoken with you and confirmed the session.";
}

export default function SessionFiles({
  booking,
  onChanged,
}: {
  booking: CounsellingBookingSummary;
  onChanged: () => Promise<void>;
}) {
  const canShare = studentCanShareFiles({
    status: booking.status,
    archivedAt: booking.archived ? "archived" : null,
  });
  const [dragging, setDragging] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { staged, sharing, add, remove, share } = useStagedFiles(booking.id);

  function pick(list: FileList | null) {
    for (const problem of add(list)) notify.error(problem);
  }

  async function shareStaged() {
    const result = await share();
    if (!result) return;
    if (result.shared === 0) notify.error(result.message);
    else if (result.ok) notify.success(result.message);
    else notify.info(result.message);
    if (result.shared > 0) await onChanged();
  }

  async function removeFile(fileId: string) {
    setRemovingId(fileId);
    const result = await removeCounsellingFile(booking.id, fileId);
    setRemovingId(null);
    setConfirmingId(null);
    if (!result.ok) {
      notify.error(result.message);
      return;
    }
    notify.success(result.message);
    await onChanged();
  }

  return (
    <div className="border-t border-navy/8 pt-5 sm:pt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-navy">
          Shared files
          {booking.files.length ? (
            <span className="ml-2 rounded-full bg-[#f1f4f9] px-2 py-0.5 text-xs text-navy/60">
              {booking.files.length}
            </span>
          ) : null}
        </p>
      </div>

      {canShare ? (
        <div className="mb-4 space-y-3">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              pick(event.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 text-center transition",
              dragging ? "border-btnBg bg-btnBg/5" : "border-navy/15 bg-[#f8fafc] hover:border-btnBg/50",
              sharing && "pointer-events-none opacity-60",
            )}
          >
            <Upload className="h-6 w-6 text-btnBg" />
            <span className="mt-2 text-sm font-semibold text-navy">
              Add documents for your counsellor
            </span>
            <span className="mt-1 text-xs text-navy/50">{COUNSELLING_FILE_HINT}</span>
            <input
              type="file"
              multiple
              className="sr-only"
              accept={COUNSELLING_FILE_ACCEPT}
              disabled={sharing}
              onChange={(event) => {
                pick(event.target.files);
                event.target.value = "";
              }}
            />
          </label>

          {staged.length ? (
            <div className="rounded-2xl border border-btnBg/20 bg-btnBg/5 p-3">
              <p className="px-1 text-xs font-semibold text-navy/70">
                Ready to share — check the files, then press Share.
              </p>
              <ul className="mt-2 space-y-2">
                {staged.map((item) => (
                  <li key={item.key} className="rounded-xl bg-white p-2.5">
                    <div className="flex items-center gap-2.5">
                      <Paperclip className="h-4 w-4 shrink-0 text-btnBg" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">
                        {item.file.name}
                      </span>
                      <span className="shrink-0 text-xs text-navy/45">
                        {formatFileSize(item.file.size)}
                      </span>
                      {!sharing ? (
                        <button
                          type="button"
                          onClick={() => remove(item.key)}
                          className="rounded-lg p-1 text-navy/40 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${item.file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                    {item.percent !== null ? (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy/10">
                        <div
                          className="h-full rounded-full bg-btnBg transition-[width]"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void shareStaged()}
                disabled={sharing}
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-4 text-sm font-bold text-white transition hover:bg-btnBg/90 disabled:opacity-60"
              >
                {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sharing
                  ? "Sharing..."
                  : `Share ${staged.length} file${staged.length > 1 ? "s" : ""} with your counsellor`}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-navy/8 bg-[#f7f9fc] p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-navy/50 shadow-sm">
            <Lock className="h-4 w-4" />
          </span>
          <p className="text-sm leading-6 text-navy/65">{lockedMessage(booking)}</p>
        </div>
      )}

      {booking.files.length > 0 ? (
        <ul className="space-y-2">
          {booking.files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-xl border border-navy/8 p-3 transition hover:bg-[#f7f9fc]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-heroBg text-accent">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-navy">{file.fileName}</span>
                <span className="block text-xs text-navy/45">
                  {file.uploadedByMe ? "You" : file.uploadedByName} ·{" "}
                  {dateFormatter.format(new Date(file.createdAt))}
                </span>
              </span>
              {confirmingId === file.id ? (
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void removeFile(file.id)}
                    disabled={removingId === file.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {removingId === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-lg px-2 py-1.5 text-xs font-semibold text-navy/60 transition hover:bg-navy/5"
                  >
                    Keep
                  </button>
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1">
                  <a
                    href={`/api/counselling/bookings/${booking.id}/files/${file.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/45 transition hover:bg-navy/10 hover:text-navy"
                    title="Open file"
                    aria-label={`Open ${file.fileName}`}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {file.uploadedByMe && canShare ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(file.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/40 transition hover:bg-red-50 hover:text-red-600"
                      title="Remove this file"
                      aria-label={`Remove ${file.fileName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-navy/12 py-6 text-center text-sm text-navy/45">
          {canShare
            ? "No files yet. Share report cards, syllabus or past papers above."
            : "Files from your counsellor will appear here."}
        </p>
      )}
    </div>
  );
}
