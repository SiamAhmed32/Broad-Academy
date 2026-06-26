import { z } from "zod";

export const learningSlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const lessonProgressSchema = z.object({
  lessonId: z.string().cuid(),
  completed: z.boolean().optional(),
  watchedSeconds: z.coerce.number().int().min(0).max(86_400).optional(),
  lastPositionSec: z.coerce.number().int().min(0).max(86_400).optional(),
});

export const quizSubmissionSchema = z.object({
  quizId: z.string().cuid(),
  startedAt: z.string().datetime().optional(),
  answers: z
    .record(z.string().cuid(), z.array(z.string().cuid()).max(10))
    .refine((answers) => Object.keys(answers).length <= 100),
});
