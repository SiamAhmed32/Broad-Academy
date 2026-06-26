import { z } from "zod";

export const courseLevelValues = [
  "class-6",
  "class-7",
  "class-8",
  "class-9",
  "class-10",
  "class-11",
  "class-12",
] as const;

export const courseSortValues = [
  "featured",
  "popular",
  "rating",
  "newest",
  "price-low",
  "price-high",
] as const;

export const courseListQuerySchema = z.object({
  search: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().trim().max(50).optional().catch(undefined),
  level: z.enum(courseLevelValues).optional().catch(undefined),
  sort: z.enum(courseSortValues).default("featured").catch("featured"),
  page: z.coerce.number().int().min(1).max(100).default(1).catch(1),
  limit: z.coerce.number().int().min(1).max(24).default(9).catch(9),
});

export const courseSlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export type CourseListQuery = z.infer<typeof courseListQuerySchema>;
export type CourseLevelSlug = (typeof courseLevelValues)[number];
export type CourseSort = (typeof courseSortValues)[number];
