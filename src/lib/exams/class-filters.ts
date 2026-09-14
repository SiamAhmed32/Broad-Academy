export const EXAM_CLASS_CATEGORIES = [
  { key: "class-6", label: "Class 6", pattern: /class\s*6\b/i },
  { key: "class-7", label: "Class 7", pattern: /class\s*7\b/i },
  { key: "class-8", label: "Class 8", pattern: /class\s*8\b/i },
  { key: "class-9", label: "Class 9", pattern: /class\s*9\b/i },
  { key: "class-10", label: "Class 10", pattern: /class\s*10\b/i },
  { key: "ssc", label: "SSC", pattern: /\bssc\b/i },
] as const;

function haystack(code?: string | null, title?: string | null) {
  return `${code ?? ""} ${title ?? ""}`;
}

export function examClassLabel(
  code?: string | null,
  title?: string | null,
) {
  const found = EXAM_CLASS_CATEGORIES.find((item) =>
    item.pattern.test(haystack(code, title)),
  );
  return found?.label ?? "Exam";
}

export function examMatchesClass(
  code: string | null | undefined,
  key: string,
  title?: string | null,
) {
  const found = EXAM_CLASS_CATEGORIES.find((item) => item.key === key);
  if (!found) return false;
  return found.pattern.test(haystack(code, title));
}
