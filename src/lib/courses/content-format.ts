export function formatCourseDuration(durationMinutes: number, lessonCount: number) {
  if (lessonCount === 0) return "—";
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = durationMinutes / 60;
  if (hours < 10 && !Number.isInteger(hours)) {
    return `${hours.toFixed(1)} hours`;
  }

  const rounded = Math.round(hours);
  return rounded === 1 ? "1 hour" : `${rounded} hours`;
}

export function formatLessonDuration(durationSeconds: number) {
  if (durationSeconds <= 0) return null;
  if (durationSeconds < 60) return `${durationSeconds}s`;
  const minutes = Math.round(durationSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function lessonTypeLabel(type: "VIDEO" | "READING" | "QUIZ") {
  if (type === "QUIZ") return "Quiz";
  if (type === "READING") return "Reading";
  return "Video";
}

const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** "1,500" → "১,৫০০". Deterministic (no Intl locale data), so SSR and hydration match. */
export function toBanglaDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => banglaDigits[Number(digit)]);
}

/** Course fee in Bangla digits, e.g. "৳১,৫০০". */
export function formatBanglaTaka(amount: number) {
  return `৳${toBanglaDigits(amount.toLocaleString("en-US"))}`;
}
