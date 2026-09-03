/**
 * Student learning-progress status rules.
 *
 * Shared by the admin API (which computes the stored value) and the admin UI
 * (which renders labels and tones), so both sides always agree.
 *
 * Priority order matters — the buckets overlap by design:
 *   1. COMPLETED       progress is 100%, whatever the last-active date is.
 *   2. AT_RISK         progress below 40%, or last active 8+ days ago.
 *   3. NEEDS_ATTENTION progress 40–69%, or last active 4–7 days ago.
 *   4. ON_TRACK        progress 70%+ and last active within the last 3 days.
 *
 * NOT_ENROLLED is outside that scale: the student has no enrolled lessons yet,
 * so there is no progress to judge them on.
 */

export const STUDENT_PROGRESS_STATUSES = [
  "ON_TRACK",
  "NEEDS_ATTENTION",
  "AT_RISK",
  "COMPLETED",
  "NOT_ENROLLED",
] as const;

export type StudentProgressStatus = (typeof STUDENT_PROGRESS_STATUSES)[number];

/** Percent thresholds, inclusive lower bounds. */
export const PROGRESS_THRESHOLDS = {
  completed: 100,
  onTrack: 70,
  needsAttention: 40,
} as const;

/** Whole days since last activity, inclusive lower bounds. */
export const INACTIVITY_THRESHOLDS = {
  onTrackMaxDays: 3,
  needsAttentionMaxDays: 7,
} as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole days between `lastActiveAt` and `now`, or `null` when the student has
 * never been active. Never negative — a future timestamp counts as today.
 */
export function daysSinceActive(
  lastActiveAt: Date | string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!lastActiveAt) return null;
  const then = lastActiveAt instanceof Date ? lastActiveAt : new Date(lastActiveAt);
  if (Number.isNaN(then.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / MS_PER_DAY));
}

export function resolveStudentProgressStatus(input: {
  /** Overall progress, 0–100. */
  progressPercent: number;
  /** Total lessons across the courses being measured. */
  totalLessons: number;
  /** Whole days since last activity, or null if never active. */
  daysInactive: number | null;
}): StudentProgressStatus {
  const { progressPercent, totalLessons, daysInactive } = input;

  // Nothing to measure yet.
  if (totalLessons <= 0) return "NOT_ENROLLED";

  // Highest priority: a finished course stays Completed however long ago the
  // student was last seen.
  if (progressPercent >= PROGRESS_THRESHOLDS.completed) return "COMPLETED";

  // "Never active" is at least as bad as the longest inactivity window.
  const inactiveDays = daysInactive ?? Number.POSITIVE_INFINITY;

  if (
    progressPercent < PROGRESS_THRESHOLDS.needsAttention ||
    inactiveDays > INACTIVITY_THRESHOLDS.needsAttentionMaxDays
  ) {
    return "AT_RISK";
  }

  if (
    progressPercent < PROGRESS_THRESHOLDS.onTrack ||
    inactiveDays > INACTIVITY_THRESHOLDS.onTrackMaxDays
  ) {
    return "NEEDS_ATTENTION";
  }

  return "ON_TRACK";
}

export const STUDENT_PROGRESS_STATUS_LABELS: Record<StudentProgressStatus, string> = {
  ON_TRACK: "On Track",
  NEEDS_ATTENTION: "Needs Attention",
  AT_RISK: "At Risk",
  COMPLETED: "Completed",
  NOT_ENROLLED: "Not Enrolled",
};

/** Percent completed, rounded to a whole number and clamped to 0–100. */
export function calculateProgressPercent(completedLessons: number, totalLessons: number) {
  if (totalLessons <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completedLessons / totalLessons) * 100)));
}

/** "Today", "Yesterday", "5 days ago", "Never". */
export function formatLastActive(
  lastActiveAt: Date | string | null | undefined,
  now: Date = new Date(),
) {
  const days = daysSinceActive(lastActiveAt, now);
  if (days === null) return "Never";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
