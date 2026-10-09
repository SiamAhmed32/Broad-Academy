/**
 * Opens a file the user picked (not uploaded yet) in a new tab so they can
 * check it before sending. No "noopener": Chrome may block blob links opened
 * that way, and the file is the user's own PDF, image or document.
 */
export function previewLocalFile(file: File) {
  const url = URL.createObjectURL(file);
  window.open(url, "_blank");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
