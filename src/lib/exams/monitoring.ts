/**
 * Shared helpers for the admin Exam Monitoring screens.
 *
 * Kept free of Prisma imports so both the server service and the client
 * components can use the same formatting and grading rules.
 */

/** Marks thresholds used to colour the "Marks (Obtained / Total)" column. */
export type MarksTone = "good" | "average" | "poor";

export function marksTone(score: number, total: number): MarksTone {
  if (total <= 0) return "poor";
  const percent = (score / total) * 100;
  if (percent >= 70) return "good";
  if (percent >= 50) return "average";
  return "poor";
}

/** "42 min", "1 hr 05 min", "38 sec" — matches the monitoring table design. */
export function formatCompletionTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} sec`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} hr ${String(remainder).padStart(2, "0")} min`;
}

/** The academy stores class as a plain integer; the UI always labels it. */
export function formatClassLabel(classLevel: number | null | undefined) {
  return typeof classLevel === "number" ? `Class ${classLevel}` : "—";
}

export function scorePercent(score: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((score / total) * 100);
}
