import { z } from "zod";

import { isSafeStoredImageReference } from "@/lib/media/images";
import { extractYouTubeVideoId } from "@/lib/video/youtube";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const adminCourseSchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: slugSchema.optional(),
  shortDescription: z.string().trim().min(10).max(300),
  category: z.string().trim().min(2).max(80),
  level: z.enum([
    "CLASS_6",
    "CLASS_7",
    "CLASS_8",
    "CLASS_9",
    "CLASS_10",
    "CLASS_11",
    "CLASS_12",
  ]),
  subject: z.string().trim().min(2).max(80),
  instructorName: z.string().trim().min(2).max(80),
  thumbnailUrl: z
    .string()
    .trim()
    .max(500)
    .refine(isSafeStoredImageReference, "Upload a valid course image."),
  price: z.coerce.number().int().min(0),
  originalPrice: z.coerce.number().int().min(0).optional().nullable(),
  durationMinutes: z.coerce.number().int().min(1),
  lessonCount: z.coerce.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  homepageOrder: z.coerce.number().int().min(0).max(9999).default(0),
  badge: z.string().trim().max(40).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const adminModuleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

export const adminLessonFieldsSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().min(5).max(1000),
  type: z.enum(["VIDEO", "READING", "QUIZ"]).default("VIDEO"),
  youtubeVideoId: z
    .string()
    .trim()
    .max(300)
    .optional()
    .nullable()
    .transform((value) => {
      if (!value) return null;
      return extractYouTubeVideoId(value);
    }),
  durationSeconds: z.coerce.number().int().min(0).default(0),
  content: z.string().trim().max(10000).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isPreview: z.boolean().default(false),
});

function refineVideoLessonYoutube(
  data: { type?: "VIDEO" | "READING" | "QUIZ"; youtubeVideoId?: string | null },
  ctx: z.RefinementCtx,
) {
  if (data.type === "VIDEO" && !data.youtubeVideoId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid YouTube link or video ID.",
      path: ["youtubeVideoId"],
    });
  }
}

export const adminLessonSchema = adminLessonFieldsSchema.superRefine(
  refineVideoLessonYoutube,
);

export const adminLessonPatchSchema = adminLessonFieldsSchema
  .omit({ moduleId: true })
  .partial()
  .extend({ id: z.string().min(1) })
  .superRefine(refineVideoLessonYoutube);

export const adminLessonResourceSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120),
  url: z
    .string()
    .trim()
    .url("Enter a valid link.")
    .max(1000)
    .refine(
      (value) => value.startsWith("https://"),
      "Use a secure https:// link (Google Drive, Google Docs, PDF link, etc.).",
    ),
});

export const adminQuizSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  passPercent: z.coerce.number().int().min(1).max(100).default(60),
  timeLimitSeconds: z.coerce
    .number()
    .int()
    .min(60)
    .max(7_200)
    .optional()
    .nullable(),
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(3).max(500),
        explanation: z.string().trim().max(500).optional().nullable(),
        displayOrder: z.coerce.number().int().min(0),
        options: z
          .array(
            z.object({
              text: z.string().trim().min(1).max(200),
              isCorrect: z.boolean(),
              displayOrder: z.coerce.number().int().min(0),
            }),
          )
          .min(2)
          .max(6)
          .refine(
            (options) => options.some((option) => option.isCorrect),
            "Select at least one correct answer.",
          ),
      }),
    )
    .min(1)
    .max(30),
});


export const adminAnnouncementSchema = z.object({
  text: z.string().trim().min(5, "Announcement text must be at least 5 characters.").max(300),
  badge: z.string().trim().max(30).optional().nullable(),
  ctaText: z.string().trim().max(30).optional().nullable(),
  ctaLink: z.string().trim().max(200).optional().nullable(),
  isActive: z.boolean().default(false),
  bgGradient: z.string().trim().min(5).max(150).default("from-violet-600 to-indigo-600"),
  textColor: z.string().trim().min(3).max(50).default("text-white"),
});

const optionalCampaignDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? new Date(value) : null))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), "Enter a valid date and time.");

export const adminPopupCampaignSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    content: z.string().trim().min(10).max(1000),
    badge: z.string().trim().max(30).optional().nullable(),
    imageUrl: z
      .string()
      .trim()
      .max(500)
      .refine(
        (value) => !value || isSafeStoredImageReference(value),
        "Upload the campaign image using the secure uploader.",
      )
      .optional()
      .nullable(),
    ctaText: z.string().trim().max(40).optional().nullable(),
    ctaLink: z
      .string()
      .trim()
      .max(300)
      .refine(
        (value) =>
          !value ||
          (value.startsWith("/") && !value.startsWith("//")) ||
          value.startsWith("https://"),
        "Use an internal path or a secure https:// link.",
      )
      .optional()
      .nullable(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    audience: z.enum(["ALL", "GUESTS", "STUDENTS"]).default("ALL"),
    frequency: z
      .enum(["ONCE_PER_CAMPAIGN", "ONCE_PER_SESSION", "EVERY_VISIT"])
      .default("ONCE_PER_CAMPAIGN"),
    startsAt: optionalCampaignDate,
    endsAt: optionalCampaignDate,
    priority: z.coerce.number().int().min(0).max(100).default(0),
    originalPrice: z.coerce.number().int().min(1).optional().nullable(),
    salePrice: z.coerce.number().int().min(1).optional().nullable(),
    countdownEndsAt: optionalCampaignDate,
    theme: z.enum(["LIGHT", "DARK_ROYAL", "DARK_MYSTIC"]).default("LIGHT"),
  })
  .superRefine((data, ctx) => {
    if (data.endsAt && data.startsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after the start time.",
        path: ["endsAt"],
      });
    }
    if (data.ctaText && !data.ctaLink) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a destination for the button.",
        path: ["ctaLink"],
      });
    }
    if (data.ctaLink && !data.ctaText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add button text for this destination.",
        path: ["ctaText"],
      });
    }
    if (data.salePrice && data.originalPrice && data.salePrice >= data.originalPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sale price must be lower than the original price.",
        path: ["salePrice"],
      });
    }

  });


export const adminTestimonialSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  identity: z.string().trim().min(2).max(120),
  review: z.string().trim().min(10).max(800),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .refine(isSafeStoredImageReference, "Upload a valid testimonial image."),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const adminStudentUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["STUDENT", "ADMIN"]).optional(),
  adminRole: z.enum(["OWNER", "ADMIN", "SUB_ADMIN", "MANAGER", "TEACHER"]).nullable().optional(),
  permissions: z.array(z.string()).optional(),
  message: z.string().trim().max(1000).optional(),
});

export const adminStudentStatusPatchSchema = z
  .object({
    id: z.string().min(1),
    status: z.enum(["ACTIVE", "SUSPENDED"]),
    message: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "SUSPENDED") {
      const message = data.message?.trim() ?? "";
      if (message.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Include a message of at least 10 characters when suspending an account.",
          path: ["message"],
        });
      }
    }
  });

export const adminStaffUpdateSchema = z.object({
  adminRole: z.enum(["OWNER", "ADMIN", "SUB_ADMIN", "MANAGER", "TEACHER"]),
});

export const adminDocumentUpdateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "APPROVED", "REJECTED"]),
  reviewNote: z.string().trim().max(1000).optional().nullable(),
});

export const adminContactUpdateSchema = z.object({
  status: z.enum(["NEW", "READ", "ARCHIVED"]),
});

export const adminCounsellingUpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
});

export const adminListQuerySchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  search: z.string().trim().max(100).optional(),
  status: z.string().trim().max(40).optional(),
  courseId: z.string().trim().min(1).max(40).optional(),
  sort: z.string().trim().max(40).optional(),
  compact: z
    .preprocess((value) => value === true || value === "true" || value === "1", z.boolean())
    .default(false),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});

export const adminUserListQuerySchema = adminListQuerySchema.extend({
  role: z.enum(["all", "STUDENT", "ADMIN"]).default("all"),
  enrollment: z
    .enum(["all", "enrolled", "pending_request", "not_enrolled"])
    .default("all"),
  sort: z
    .enum([
      "created_desc",
      "created_asc",
      "name_asc",
      "name_desc",
      "last_login_desc",
      "enrollments_desc",
    ])
    .default("created_desc"),
});

const examDateSchema = z
  .string()
  .trim()
  .transform((value) => new Date(value))
  .refine((value) => !Number.isNaN(value.getTime()), "Enter a valid date and time.");

export const adminExamSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters.").max(120),
    slug: slugSchema.optional(),
    code: z.string().trim().max(40).default("EXAM").optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
    bannerUrl: z
      .string()
      .trim()
      .max(500)
      .refine(
        (value) => !value || isSafeStoredImageReference(value),
        "Upload a valid exam banner image.",
      )
      .optional()
      .nullable(),
    price: z.coerce.number().int().min(0, "Price must be 0 or greater."),
    originalPrice: z.coerce.number().int().min(0).optional().nullable(),
    durationMinutes: z.coerce.number().int().min(1, "Duration must be at least 1 minute."),
    totalMarks: z.coerce.number().int().min(1, "Total marks must be at least 1."),
    negativeMarking: z.coerce.number().min(0).max(2).default(0.0),
    startsAt: examDateSchema.optional(),
    endsAt: examDateSchema.optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  })
  .superRefine((data, ctx) => {
    if (data.endsAt && data.startsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after the start time.",
        path: ["endsAt"],
      });
    }
  });

export const adminExamQuestionSchema = z.object({
  prompt: z.string().trim().min(1, "Question prompt is required."),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => !value || isSafeStoredImageReference(value), "Invalid image link.")
    .optional()
    .nullable(),
  explanation: z.string().trim().max(1000).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0),
  options: z
    .array(
      z.object({
        text: z.string().trim().min(1, "Option text is required."),
        isCorrect: z.boolean().default(false),
        displayOrder: z.coerce.number().int().min(0),
      }),
    )
    .min(2, "Questions must have at least 2 options.")
    .max(6, "Questions can have at most 6 options."),
});

export const adminExamQuestionsListSchema = z.object({
  questions: z.array(adminExamQuestionSchema),
});
