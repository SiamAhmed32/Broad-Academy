import type { DirectUploadResult, DirectUploadTicket } from "./direct-upload";

/** Cloudinary's errors ("Invalid image file", ...) in words students understand. */
function uploadErrorMessage(status: number, detail: string | undefined) {
  if (detail) console.warn("Upload rejected:", status, detail);
  if (/too large/i.test(detail ?? "")) return "This file is too large to upload.";
  if (status === 400 && /invalid|corrupt|unsupported/i.test(detail ?? "")) {
    return "This file could not be read. Check that it opens on your device, then try again.";
  }
  return "Upload failed. Please try again.";
}

/**
 * Uploads one file straight to Cloudinary with a server-signed ticket.
 * Uses XHR (not fetch) so the UI can show upload progress.
 */
export function uploadFileDirect(
  file: File,
  ticket: DirectUploadTicket,
  onProgress?: (percent: number) => void,
): Promise<DirectUploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", ticket.apiKey);
    form.append("timestamp", String(ticket.timestamp));
    form.append("public_id", ticket.publicId);
    form.append("signature", ticket.signature);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(ticket.cloudName)}/auto/upload`,
    );
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onload = () => {
      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(xhr.responseText) as Record<string, unknown>;
      } catch {
        payload = null;
      }
      if (xhr.status < 200 || xhr.status >= 300 || !payload) {
        const detail = (payload?.error as { message?: string } | undefined)?.message;
        reject(new Error(uploadErrorMessage(xhr.status, detail)));
        return;
      }
      resolve({
        publicId: String(payload.public_id),
        version: Number(payload.version),
        signature: String(payload.signature),
        resourceType: String(payload.resource_type),
        format: typeof payload.format === "string" ? payload.format : null,
        bytes: Number(payload.bytes ?? file.size),
        secureUrl: String(payload.secure_url),
      });
    };
    xhr.send(form);
  });
}
