/** Rules for files shared on a Study Plan / Counselling session (used by client and server). */

export const COUNSELLING_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const COUNSELLING_FILES_PER_BATCH = 10;

export const COUNSELLING_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "txt",
  "zip",
] as const;

export const COUNSELLING_FILE_ACCEPT = COUNSELLING_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export const COUNSELLING_FILE_HINT = "PDF, Word, image, TXT or ZIP · up to 10 MB each";

export function counsellingFolder(bookingId: string) {
  return `broad-academy/counselling-files/${bookingId}`;
}

export function fileExtension(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function isAllowedCounsellingFile(name: string) {
  return (COUNSELLING_FILE_EXTENSIONS as readonly string[]).includes(fileExtension(name));
}

/** Returns a user-facing problem with the file, or null when it can be shared. */
export function counsellingFileProblem(file: { name: string; size: number }) {
  if (!isAllowedCounsellingFile(file.name)) {
    return `${file.name}: this file type is not supported (${COUNSELLING_FILE_HINT}).`;
  }
  if (file.size === 0) return `${file.name}: the file is empty.`;
  if (file.size > COUNSELLING_FILE_MAX_BYTES) {
    return `${file.name}: files must be 10 MB or smaller.`;
  }
  return null;
}

/**
 * Students can share documents only after the team has reviewed the request,
 * spoken with the family and confirmed the session — confirming is the
 * permission. Staff can share files at any time.
 */
export function studentCanShareFiles(booking: { status: string; archivedAt?: string | Date | null }) {
  return booking.status === "CONFIRMED" && !booking.archivedAt;
}
