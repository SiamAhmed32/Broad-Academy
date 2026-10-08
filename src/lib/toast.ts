import { toast, type TypeOptions } from "react-toastify";

/**
 * Show one toast. The message doubles as the toast id, so the same message
 * can't stack up twice (double clicks, retries). Empty messages are ignored
 * rather than showing a blank toast.
 */
function show(type: TypeOptions, message: string | null | undefined) {
  const text = message?.trim();
  if (!text) return;
  toast(text, { type, toastId: text });
}

/**
 * The one way to show a toast on this site. Use it for the outcome of an
 * action (saved, sent, failed). Keep field validation and full-page states
 * inline.
 */
export const notify = {
  success: (message: string | null | undefined) => show("success", message),
  error: (message: string | null | undefined) => show("error", message),
  info: (message: string | null | undefined) => show("info", message),
};
