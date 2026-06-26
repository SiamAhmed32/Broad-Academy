export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function emptyToNull(value?: string | null) {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export function sanitizePublicInstructor<T extends Record<string, unknown>>(instructor: T) {
  const publicFields = { ...instructor };
  delete publicFields.status;
  delete publicFields.displayOrder;
  return publicFields;
}
