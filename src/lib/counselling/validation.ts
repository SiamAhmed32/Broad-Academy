import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .max(20, "Phone number is too long.")
  .regex(
    /^(\+?8801|01)[3-9]\d{8}$/,
    "Enter a valid Bangladeshi phone number."
  );

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

export const EDUCATION_LEVELS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "SSC",
  "HSC",
  "University",
  "Other",
] as const;

export const SUBJECT_INTERESTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "ICT",
  "Bangla",
  "General Science",
  "Accounting",
  "Business Studies",
  "Economics",
  "Not sure — need guidance",
] as const;

export const TIME_SLOTS = [
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "2:00 PM – 3:00 PM",
  "3:00 PM – 4:00 PM",
  "4:00 PM – 5:00 PM",
  "5:00 PM – 6:00 PM",
  "6:00 PM – 7:00 PM",
  "7:00 PM – 8:00 PM",
] as const;

export const counsellingBookingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Name must be 80 characters or fewer."),
  email: emailSchema,
  phone: phoneSchema,
  educationLevel: z.enum(EDUCATION_LEVELS, {
    error: "Select your education level.",
  }),
  subjectInterest: z.enum(SUBJECT_INTERESTS, {
    error: "Select a subject.",
  }),
  preferredDate: z
    .string()
    .min(1, "Select a preferred date.")
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: "Date must be today or a future date." }
    ),
  preferredTime: z.enum(TIME_SLOTS, {
    error: "Select a preferred time slot.",
  }),
  message: z
    .string()
    .trim()
    .max(500, "Message must be 500 characters or fewer.")
    .optional()
    .or(z.literal("")),
  pricingAcknowledged: z.literal(true, {
    error: "Please confirm you understand session fees are discussed before the session.",
  }),
});

export type CounsellingBookingInput = z.infer<typeof counsellingBookingSchema>;
