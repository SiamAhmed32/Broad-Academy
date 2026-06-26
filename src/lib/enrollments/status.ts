export const ENROLLMENT_REQUEST_STATUSES = [
  "PENDING",
  "REVIEWING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;

export type EnrollmentRequestStatus =
  (typeof ENROLLMENT_REQUEST_STATUSES)[number];

export const enrollmentRequestStatusLabel: Record<
  EnrollmentRequestStatus,
  string
> = {
  PENDING: "Pending",
  REVIEWING: "Reviewing",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export function isEnrollmentRequestOpen(status: EnrollmentRequestStatus) {
  return status === "PENDING" || status === "REVIEWING";
}
