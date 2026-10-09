/** Rules for document submissions and reply attachments (client and server). */

export const DOCUMENT_MAX_BYTES = 8 * 1024 * 1024;
export const DOCUMENT_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"] as const;
export const DOCUMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

export function studentDocumentFolder(userId: string) {
  return `broad-academy/document-submissions/${userId}`;
}

export function documentReplyFolder(documentId: string) {
  return `broad-academy/document-replies/${documentId}`;
}

/** A user-facing problem with the file, or null when it can be uploaded. */
export function documentFileProblem(file: { name: string; size: number }) {
  const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  if (!(DOCUMENT_EXTENSIONS as readonly string[]).includes(extension)) {
    return "Upload a PDF, JPG, PNG or WebP file.";
  }
  if (file.size === 0) return "The file is empty.";
  if (file.size > DOCUMENT_MAX_BYTES) return "File must be 8 MB or smaller.";
  return null;
}

/**
 * True when Cloudinary read the upload as a PDF or image. A renamed file
 * (say a .docx called .pdf) passes the name check but is stored as "raw".
 */
export function isDocumentAsset(upload: { resourceType: string; format?: string | null }) {
  return (
    upload.resourceType === "image" &&
    (DOCUMENT_EXTENSIONS as readonly string[]).includes(upload.format ?? "")
  );
}
