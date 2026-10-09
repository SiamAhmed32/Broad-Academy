import type { DirectUploadResult, DirectUploadTicket } from "@/lib/media/direct-upload";
import { uploadFileDirect } from "@/lib/media/direct-upload-client";

type ApiPayload<T> = { success?: boolean; message?: string; data?: T } | null;

const OFFLINE_MESSAGE = "Could not connect to the server. Check your connection and try again.";

/** Calls our API; never throws, so callers can always reset their loading state. */
async function request<T>(
  url: string,
  init: RequestInit,
): Promise<{ ok: boolean; payload: ApiPayload<T> }> {
  try {
    const response = await fetch(url, { credentials: "same-origin", ...init });
    const payload = (await response.json().catch(() => null)) as ApiPayload<T>;
    return { ok: response.ok && Boolean(payload?.success), payload };
  } catch {
    return { ok: false, payload: { success: false, message: OFFLINE_MESSAGE } };
  }
}

function postJson<T>(url: string, body: unknown) {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type ShareResult = {
  ok: boolean;
  message: string;
  /** How many files were saved (a batch can partly succeed). */
  shared: number;
};

/**
 * Shares files on a counselling session: signs an upload, sends each file
 * straight to Cloudinary (so large PDFs work), then saves them in one request
 * so the other side gets a single notification. Never throws.
 */
export async function shareCounsellingFiles(
  bookingId: string,
  files: File[],
  onProgress?: (fileIndex: number, percent: number) => void,
): Promise<ShareResult> {
  const signed = await postJson<{ tickets: DirectUploadTicket[] }>(
    `/api/counselling/bookings/${bookingId}/files/sign`,
    { files: files.map((file) => ({ name: file.name, size: file.size })) },
  );
  const tickets = signed.payload?.data?.tickets ?? [];
  if (!signed.ok || tickets.length !== files.length) {
    return {
      ok: false,
      shared: 0,
      message: signed.payload?.message ?? "Could not start the upload. Please try again.",
    };
  }

  const uploaded: Array<{ fileName: string; upload: DirectUploadResult }> = [];
  const failures: string[] = [];
  for (const [index, file] of files.entries()) {
    try {
      const upload = await uploadFileDirect(file, tickets[index], (percent) =>
        onProgress?.(index, percent),
      );
      uploaded.push({ fileName: file.name, upload });
    } catch (error) {
      failures.push(`${file.name}: ${error instanceof Error ? error.message : "upload failed."}`);
    }
  }

  if (uploaded.length === 0) {
    return { ok: false, shared: 0, message: failures[0] ?? "Upload failed. Please try again." };
  }

  const saved = await postJson<{ files: unknown[]; problems: string[] }>(
    `/api/counselling/bookings/${bookingId}/files`,
    { files: uploaded },
  );
  if (!saved.ok) {
    return {
      ok: false,
      shared: 0,
      message: saved.payload?.message ?? "Could not save the files. Please try again.",
    };
  }

  const shared = saved.payload?.data?.files.length ?? uploaded.length;
  const message = [saved.payload?.message ?? "Files shared.", ...failures].join(" ");
  return {
    ok: failures.length === 0 && (saved.payload?.data?.problems.length ?? 0) === 0,
    shared,
    message,
  };
}

/** Removes a shared file. Never throws. */
export async function removeCounsellingFile(
  bookingId: string,
  fileId: string,
): Promise<{ ok: boolean; message: string }> {
  const { ok, payload } = await request<unknown>(
    `/api/counselling/bookings/${bookingId}/files?fileId=${encodeURIComponent(fileId)}`,
    { method: "DELETE" },
  );
  if (!ok) return { ok: false, message: payload?.message ?? "Could not remove the file." };
  return { ok: true, message: payload?.message ?? "File removed." };
}

/** Stable id for a picked file, used to skip picking the same file twice. */
export function fileFingerprint(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}
