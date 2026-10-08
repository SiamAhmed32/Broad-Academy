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
] as const;

export const STUDENT_GROUPS = [
  "Science",
  "Business Studies",
  "Humanities",
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
    .min(2, "Enter the student's name.")
    .max(80, "Name must be 80 characters or fewer."),
  phone: phoneSchema,
  schoolName: z
    .string()
    .trim()
    .min(2, "Enter the school name.")
    .max(120, "School name must be 120 characters or fewer."),
  educationLevel: z.enum(EDUCATION_LEVELS, {
    error: "Select the class.",
  }),
  classRoll: z
    .string()
    .trim()
    .min(1, "Enter the class roll.")
    .max(20, "Class roll must be 20 characters or fewer."),
  // Optional: the signed-in account email is used when this is left empty.
  email: emailSchema.optional().or(z.literal("")),
  studentGroup: z.enum(STUDENT_GROUPS).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(5, "Briefly describe the student's problems or weak subjects.")
    .max(1000, "Please keep this under 1000 characters."),
  pricingAcknowledged: z.literal(true, {
    error: "Please give your consent to continue.",
  }),
});

export type CounsellingBookingInput = z.infer<typeof counsellingBookingSchema>;
