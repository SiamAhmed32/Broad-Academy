import type { CounsellingBookingSummary } from "@/lib/student/types";

export const sessionStatusStyles = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  CONFIRMED: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

export function sessionNextStep(booking: Pick<CounsellingBookingSummary, "status" | "paymentStatus" | "scheduledAt" | "meetingLink">) {
  if (booking.status === "CANCELLED") return "This request was cancelled.";
  if (booking.status === "COMPLETED")
    return "Session complete. View your notes and shared files.";
  if (booking.status === "CONFIRMED") {
    if (!booking.scheduledAt)
      return "Confirmed. Our team will share your session time.";
    return booking.meetingLink
      ? "Your meeting link is ready in session details."
      : "Your meeting link will appear here when shared.";
  }
  if (booking.paymentStatus === "AWAITING_PAYMENT")
    return "Action needed: submit your payment proof.";
  if (booking.paymentStatus === "PROOF_SUBMITTED")
    return "Payment proof received. Awaiting verification.";
  if (booking.paymentStatus === "PAID" || booking.paymentStatus === "WAIVED")
    return "Payment cleared. Awaiting session confirmation.";
  return "Request received. Our team will contact you about the fee and schedule.";
}

export function sessionTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}
