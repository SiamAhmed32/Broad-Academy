"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CalendarCheck, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  counsellingBookingSchema,
  type CounsellingBookingInput,
  EDUCATION_LEVELS,
} from "@/lib/counselling/validation";
import { apiFetch } from "@/lib/api/client";
import { notify } from "@/lib/toast";
import FormField from "./FormField";
import FormSelect from "./FormSelect";

type BookingFormProps = {
  mode?: "public" | "dashboard";
  defaultValues?: Partial<CounsellingBookingInput>;
  lockedFields?: Array<"fullName" | "email" | "phone">;
  onSuccess?: (bookingId?: string) => void;
  compact?: boolean;
};

export default function BookingForm({
  mode = "public",
  defaultValues,
  lockedFields = [],
  onSuccess,
  compact = false,
}: BookingFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isDashboard = mode === "dashboard";

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CounsellingBookingInput>({
    resolver: zodResolver(counsellingBookingSchema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      educationLevel: defaultValues?.educationLevel,
      message: defaultValues?.message ?? "",
      pricingAcknowledged: undefined,
    },
  });

  useEffect(() => {
    if (defaultValues?.email) return;

    let cancelled = false;

    async function prefillFromAccount() {
      const result = await apiFetch<{
        fullName?: string;
        email?: string;
        phone?: string | null;
      }>("/api/profile");

      if (cancelled || !result.success || !result.data) return;

      const current = getValues();
      if (!current.email.trim() && result.data.email) {
        setValue("email", result.data.email, { shouldDirty: false });
      }
      if (!current.fullName.trim() && result.data.fullName) {
        setValue("fullName", result.data.fullName, { shouldDirty: false });
      }
      if (!current.phone.trim() && result.data.phone) {
        setValue("phone", result.data.phone, { shouldDirty: false });
      }
    }

    void prefillFromAccount();
    return () => {
      cancelled = true;
    };
  }, [defaultValues?.email, getValues, setValue]);

  const onSubmit = async (data: CounsellingBookingInput) => {
    const result = await apiFetch<{ bookingId?: string }>("/api/counselling/book", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!result.success) {
      if (result.fields) {
        for (const [field, messages] of Object.entries(result.fields)) {
          if (Array.isArray(messages) && messages.length > 0) {
            setError(field as keyof CounsellingBookingInput, {
              message: messages[0],
            });
          }
        }
      } else {
        notify.error(result.message ?? "Something went wrong. Please try again.");
      }
      return;
    }

    // The success screen says this already, so no toast here.
    setIsSubmitted(true);
    onSuccess?.(result.data?.bookingId);
    window.requestAnimationFrame(() => {
      document.getElementById("booking-success")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const inputShell = isDashboard
    ? "rounded-xl border border-navy/10 bg-[#f7f9fc] px-4 py-3 text-sm text-navy placeholder:text-navy/35 outline-none transition focus:border-btnBg focus:bg-white focus:ring-2 focus:ring-btnBg/10"
    : undefined;

  if (isSubmitted) {
    return <SuccessMessage dashboard={isDashboard} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 ${
          isDashboard
            ? "border-amber-200/80 bg-amber-50/80"
            : "border-amber-100 bg-amber-50"
        }`}
      >
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <p className="text-sm leading-relaxed text-amber-950/80">
          Parent counselling sessions are <strong>not free</strong>. After you
          submit this request, our team will contact you to confirm availability
          and share the session fee before your appointment is finalised.
        </p>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        <FormField
          label="Parent / guardian full name"
          id="booking-fullName"
          error={errors.fullName?.message}
          {...register("fullName")}
          placeholder="Your full name"
          autoComplete="name"
          readOnly={lockedFields.includes("fullName")}
          className={inputShell}
        />
        <FormField
          label="Email"
          id="booking-email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
          placeholder="you@example.com"
          autoComplete="email"
          readOnly={lockedFields.includes("email")}
          className={inputShell}
        />
      </div>

      <div className={`grid grid-cols-1 gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        <FormField
          label="Parent / guardian phone"
          id="booking-phone"
          type="tel"
          error={errors.phone?.message}
          {...register("phone")}
          placeholder="01XXXXXXXXX"
          autoComplete="tel"
          readOnly={lockedFields.includes("phone")}
          className={inputShell}
        />
        <FormSelect
          label="Child's education level"
          id="booking-educationLevel"
          error={errors.educationLevel?.message}
          {...register("educationLevel")}
          options={EDUCATION_LEVELS as unknown as string[]}
          placeholder="Select level"
          className={inputShell}
        />
      </div>

      <div>
        <label
          htmlFor="booking-message"
          className="mb-1.5 block text-sm font-medium text-navy/80"
        >
          Message <span className="font-normal text-navy/40">(optional)</span>
        </label>
        <textarea
          id="booking-message"
          rows={3}
          className={`w-full resize-none text-sm outline-none transition ${
            inputShell ??
            "rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
          }`}
          placeholder="Share your child's study challenges, goals, weak areas, or questions..."
          {...register("message")}
        />
        {errors.message ? (
          <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy/8 bg-white p-4 transition hover:border-navy/15">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
          {...register("pricingAcknowledged")}
        />
        <span className="text-sm leading-relaxed text-navy/70">
          I understand that parent counselling is a paid service and fees will be
          confirmed by the Broad Academy team before the session is scheduled.
        </span>
      </label>
      {errors.pricingAcknowledged ? (
        <p className="text-xs text-red-600">{errors.pricingAcknowledged.message}</p>
      ) : null}

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-btnBg/20 transition-all hover:bg-btnBg/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting request...
          </>
        ) : (
          <>
            <CalendarCheck className="h-4 w-4" />
            {isDashboard ? "Submit parent counselling request" : "Request parent counselling"}
          </>
        )}
      </motion.button>
    </form>
  );
}

function SuccessMessage({ dashboard }: { dashboard?: boolean }) {
  return (
    <motion.div
      id="booking-success"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/70 px-6 py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm"
      >
        <CheckCircle2 className="h-9 w-9" />
      </motion.div>
      <h3 className="font-bangla mt-5 text-xl font-semibold text-navy">
        আপনার রিকোয়েস্ট সফলভাবে জমা হয়েছে
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy/70">
        {dashboard
          ? "We emailed you a summary. Our team will contact you shortly to confirm the parent counselling session and discuss fees."
          : "Our academic advisor will reach out soon to confirm your parent counselling session and share pricing details."}
      </p>
    </motion.div>
  );
}
