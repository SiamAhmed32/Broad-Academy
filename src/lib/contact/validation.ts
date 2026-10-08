import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

const phoneSchema = z
  .string()
  .trim()
  .max(20, "Phone number is too long.")
  .regex(/^(\+?8801|01)[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number.")
  .or(z.literal(""));

export const contactRoles = [
  "parent",
  "student",
  "teacher-mentor",
  "other",
] as const;

// Stored as plain strings, so older messages keep their old subject values.
export const contactSubjects = [
  "course-information",
  "admission",
  "technical",
  "counselling",
  "partnership",
  "advertisement",
  "teacher-mentor",
  "other",
] as const;

export const contactSources = ["homepage", "contact-page"] as const;

export const contactSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(80, "Name must be 80 characters or fewer.")
      .regex(
        /^[\p{L}\s'.-]+$/u,
        "Name can only include letters, spaces, apostrophes, and hyphens.",
      ),
    email: emailSchema,
    phone: phoneSchema.optional().default(""),
    role: z.enum(contactRoles, {
      error: "Select who you are contacting us as.",
    }),
    subject: z.enum(contactSubjects, {
      error: "Select a subject for your message.",
    }),
    message: z
      .string()
      .trim()
      .min(20, "Please write at least 20 characters.")
      .max(2000, "Message must be 2000 characters or fewer."),
    source: z.enum(contactSources).default("contact-page"),
    website: z
      .string()
      .max(0, "Invalid submission.")
      .optional()
      .default(""),
  })
  // The contact page asks for a phone number; the short homepage form has
  // no phone field, so it stays optional there.
  .superRefine((data, ctx) => {
    if (data.source === "contact-page" && !data.phone) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter your phone number.",
      });
    }
  });

export type ContactInput = z.infer<typeof contactSchema>;

export const contactRoleLabels: Record<(typeof contactRoles)[number], string> = {
  parent: "Parent / Guardian",
  student: "Student",
  "teacher-mentor": "Teacher / Mentor",
  other: "Other",
};

export const contactSubjectLabels: Record<
  (typeof contactSubjects)[number],
  string
> = {
  "course-information": "Course Information",
  admission: "Admission Support",
  technical: "Technical Support",
  counselling: "Counselling",
  partnership: "Partnership",
  advertisement: "Advertisement",
  "teacher-mentor": "Teacher/Mentor",
  other: "Other",
};
