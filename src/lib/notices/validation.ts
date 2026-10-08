import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

export const adminNoticeSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(160),
  body: z.string().trim().min(3, "Write the notice details.").max(5000),
  linkUrl: optionalText(500).refine(
    (value) => !value || /^(https?:\/\/|\/)/.test(value),
    "Link must start with https:// or /",
  ),
  linkLabel: optionalText(60),
  pinned: z.boolean().default(false),
  published: z.boolean().default(true),
  notifyStudents: z.boolean().default(true),
});

export type AdminNoticeInput = z.infer<typeof adminNoticeSchema>;
