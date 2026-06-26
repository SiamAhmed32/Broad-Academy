import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters.")
  .max(80, "Slug must be 80 characters or fewer.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may only contain lowercase letters, numbers, and hyphens.",
  );

const urlSchema = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .max(500)
  .refine(
    (value) => value.startsWith("https://"),
    "Only secure HTTPS URLs are allowed.",
  );

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => value === "" || (value.startsWith("https://") && z.string().url().safeParse(value).success),
    "Enter a valid HTTPS URL.",
  )
  .optional()
  .or(z.literal(""));

const stringArraySchema = z
  .array(z.string().trim().min(1).max(80))
  .max(20, "Too many items.")
  .default([]);

export const instructorListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  specialty: z.string().trim().max(80).optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
  sort: z.enum(["featured", "rating", "students", "newest"]).default("featured"),
});

export const createInstructorSchema = z.object({
  slug: slugSchema.optional(),
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer."),
  title: z.string().trim().min(2).max(120),
  shortBio: z
    .string()
    .trim()
    .min(10, "Short bio must be at least 10 characters.")
    .max(220, "Short bio must be 220 characters or fewer."),
  bio: z
    .string()
    .trim()
    .min(30, "Full bio must be at least 30 characters.")
    .max(5000, "Full bio must be 5000 characters or fewer."),
  avatarUrl: urlSchema,
  coverUrl: optionalUrlSchema,
  specialty: z.string().trim().min(2).max(80),
  subjects: stringArraySchema,
  expertise: stringArraySchema,
  experienceYears: z.coerce.number().int().min(0).max(60).default(0),
  studentsCount: z.coerce.number().int().min(0).max(10_000_000).default(0),
  coursesCount: z.coerce.number().int().min(0).max(1000).default(0),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().min(0).max(1_000_000).default(0),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).default("ACTIVE"),
  linkedIn: optionalUrlSchema,
  twitter: optionalUrlSchema,
  website: optionalUrlSchema,
});

export const updateInstructorSchema = createInstructorSchema.partial();

export type InstructorListQuery = z.infer<typeof instructorListQuerySchema>;
export type CreateInstructorInput = z.infer<typeof createInstructorSchema>;
export type UpdateInstructorInput = z.infer<typeof updateInstructorSchema>;
