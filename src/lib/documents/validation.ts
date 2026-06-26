import { z } from "zod";

export const DOCUMENT_TYPES = [
  "Handwritten assignment",
  "Report card / marksheet",
  "School ID or admission form",
  "Guardian consent letter",
  "Other academic document",
] as const;

export const documentSubmissionSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
  documentType: z.enum(DOCUMENT_TYPES),
  message: z.string().trim().max(500).optional().or(z.literal("")),
  website: z.string().max(0).optional(),
});
