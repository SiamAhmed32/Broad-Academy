import type { DirectUploadResult, DirectUploadTicket } from "./direct-upload";
import { uploadFileDirect } from "./direct-upload-client";

/**
 * Asks `signUrl` to sign one upload, then sends the file straight to
 * Cloudinary. Throws an Error with a user-facing message on failure.
 */
export async function uploadOneDirect(
  signUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<DirectUploadResult> {
  let response: Response;
  try {
    response = await fetch(signUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, size: file.size }),
    });
  } catch {
    throw new Error("Could not connect to the server. Check your connection and try again.");
  }
  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: { tickets?: DirectUploadTicket[] };
  } | null;
  const ticket = payload?.data?.tickets?.[0];
  if (!response.ok || !payload?.success || !ticket) {
    throw new Error(payload?.message ?? "Could not start the upload. Please try again.");
  }
  return uploadFileDirect(file, ticket, onProgress);
}
