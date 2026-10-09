import { Check, XCircle } from "lucide-react";

import type { CounsellingBookingSummary } from "@/lib/student/types";
import { cn } from "@/lib/utils";

type Step = { label: string; hint: string; done: boolean };

/**
 * Where the request is in the process, so families always know what happens
 * next: submitted → reviewed & fee shared → payment → confirmed → completed.
 */
export default function SessionProgress({ booking }: { booking: CounsellingBookingSummary }) {
  if (booking.status === "CANCELLED") {
    return (
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
        <p>
          This request was cancelled. If you think this is a mistake or need a new
          session, book again or contact us.
        </p>
      </div>
    );
  }

  const confirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED";
  const noFeeDue =
    booking.paymentStatus === "WAIVED" || (booking.sessionFee != null && booking.sessionFee <= 0);
  const paid = booking.paymentStatus === "PAID" || noFeeDue || confirmed;
  const reviewed = booking.paymentStatus !== "UNQUOTED" || confirmed || noFeeDue;

  const steps: Step[] = [
    { label: "Request submitted", hint: "We received your request.", done: true },
    {
      label: "Review & fee",
      hint: reviewed
        ? "Our team reviewed your request."
        : "Our team will review it and call you.",
      done: reviewed,
    },
    {
      label: "Payment",
      hint:
        booking.paymentStatus === "PROOF_SUBMITTED"
          ? "Proof received — being verified."
          : booking.paymentStatus === "WAIVED"
            ? "Fee waived."
            : paid
              ? "Payment verified."
              : "Pay the session fee with bKash.",
      done: paid,
    },
    {
      label: "Session confirmed",
      hint: confirmed ? "You can now share documents." : "Documents can be shared after this.",
      done: confirmed,
    },
    {
      label: "Completed",
      hint: booking.status === "COMPLETED" ? "Session finished." : "After your session.",
      done: booking.status === "COMPLETED",
    },
  ];
  const currentIndex = steps.findIndex((step) => !step.done);

  return (
    <ol
      aria-label="Request progress"
      className="mt-5 grid gap-3 rounded-2xl border border-navy/8 bg-white p-4 sm:grid-cols-5 sm:gap-2 sm:p-5"
    >
      {steps.map((step, index) => {
        const current = index === currentIndex;
        return (
          <li key={step.label} className="relative flex gap-3 sm:flex-col sm:gap-2">
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-0.5rem)] w-px sm:left-8 sm:top-[15px] sm:h-px sm:w-[calc(100%-1.5rem)]",
                  step.done ? "bg-btnBg" : "bg-navy/10",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                step.done
                  ? "bg-btnBg text-white"
                  : current
                    ? "bg-amber-100 text-amber-700 ring-4 ring-amber-50"
                    : "bg-[#f1f4f9] text-navy/40",
              )}
            >
              {step.done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className="min-w-0 pb-1 sm:pb-0">
              <span
                className={cn(
                  "block text-sm font-semibold",
                  step.done || current ? "text-navy" : "text-navy/45",
                )}
              >
                {step.label}
              </span>
              <span className={cn("mt-0.5 block text-xs leading-5", current ? "text-amber-700" : "text-navy/50")}>
                {step.hint}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
