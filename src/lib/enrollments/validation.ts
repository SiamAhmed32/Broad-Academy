import { z } from "zod";

const bangladeshPhone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .refine(
    (value) => /^(?:\+?88)?01[3-9]\d{8}$/.test(value),
    "Enter a valid Bangladeshi mobile number.",
  )
  .transform((value) => {
    const local = value.replace(/^\+?88/, "");
    return `+88${local}`;
  });

export const enrollmentRequestSchema = z.object({
  courseId: z.string().trim().min(1),
  studentPhone: bangladeshPhone,
  guardianPhone: bangladeshPhone,
  bkashSenderNumber: bangladeshPhone,
  bkashTransactionId: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, "Enter the bKash transaction ID.")
    .max(30)
    .regex(/^[A-Z0-9]+$/, "Transaction ID may contain only letters and numbers."),
  classLevel: z.coerce
    .number()
    .int("Select your class.")
    .min(1, "Class must be between 1 and 12.")
    .max(12, "Class must be between 1 and 12."),
  studentNote: z.string().trim().max(500).optional().transform((value) => value || null),
});

export const enrollmentReviewSchema = z
  .object({
    id: z.string().trim().min(1),
    action: z.enum(["REVIEWING", "APPROVE", "REJECT"]),
    reviewNote: z.string().trim().max(1000).optional().transform((value) => value || null),
  })
  .superRefine((value, context) => {
    if (value.action === "REJECT" && (!value.reviewNote || value.reviewNote.length < 3)) {
      context.addIssue({
        code: "custom",
        path: ["reviewNote"],
        message: "Add a short reason before rejecting this request.",
      });
    }
  });

export const adminDirectEnrollmentSchema = z.object({
  userId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  grantNote: z
    .string()
    .trim()
    .min(3, "Explain why access is being granted without a payment form.")
    .max(500),
});
