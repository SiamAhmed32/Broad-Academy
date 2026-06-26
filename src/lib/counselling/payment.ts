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

export const counsellingPaymentSubmissionSchema = z.object({
  bkashSenderNumber: bangladeshPhone,
  bkashTransactionId: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, "Enter the bKash transaction ID.")
    .max(30)
    .regex(/^[A-Z0-9]+$/, "Transaction ID may contain only letters and numbers."),
});

export const counsellingAdminPatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  meetingLink: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .nullable()
    .optional()
    .or(z.literal("")),
  counsellorNotes: z.string().trim().nullable().optional(),
  sessionFee: z.coerce.number().int().min(0).max(500_000).optional().nullable(),
  paymentAction: z.enum(["mark_paid", "waive", "reopen_payment"]).optional(),
  paymentNote: z.string().trim().max(500).optional().nullable(),
  archiveAction: z.enum(["archive", "restore"]).optional(),
});

export const PAYMENT_STATUS_LABELS: Record<
  "UNQUOTED" | "AWAITING_PAYMENT" | "PROOF_SUBMITTED" | "PAID" | "WAIVED",
  string
> = {
  UNQUOTED: "Fee not quoted",
  AWAITING_PAYMENT: "Awaiting payment",
  PROOF_SUBMITTED: "Proof submitted",
  PAID: "Paid",
  WAIVED: "Fee waived",
};

export function canConfirmCounsellingSession(
  sessionFee: number | null | undefined,
  paymentStatus: string,
) {
  if (!sessionFee || sessionFee <= 0) return true;
  return paymentStatus === "PAID" || paymentStatus === "WAIVED";
}
