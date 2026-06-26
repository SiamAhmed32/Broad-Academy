import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

export const newsletterSources = ["footer", "homepage"] as const;

export const newsletterSchema = z.object({
  email: emailSchema,
  source: z.enum(newsletterSources).default("footer"),
  website: z
    .string()
    .max(0, "Invalid submission.")
    .optional()
    .default(""),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
