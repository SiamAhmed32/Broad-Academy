"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  CheckCircle2,
  Loader2,
  LogIn,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  counsellingBookingSchema,
  type CounsellingBookingInput,
  EDUCATION_LEVELS,
  STUDENT_GROUPS,
} from "@/lib/counselling/validation";
import { apiFetch } from "@/lib/api/client";
import { notify } from "@/lib/toast";
import FormField from "./FormField";
import FormSelect from "./FormSelect";

type BookingFormProps = {
  mode?: "public" | "dashboard";
  defaultValues?: Partial<CounsellingBookingInput>;
  onSuccess?: (bookingId?: string) => void;
  compact?: boolean;
};

type AuthState = "checking" | "guest" | "signed-in";

export default function BookingForm({
  mode = "public",
  defaultValues,
  onSuccess,
  compact = false,
}: BookingFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isDashboard = mode === "dashboard";
  // The dashboard is only reachable when signed in, so skip the check there.
  const [authState, setAuthState] = useState<AuthState>(
    isDashboard ? "signed-in" : "checking",
  );

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
      phone: defaultValues?.phone ?? "",
      schoolName: "",
      educationLevel: defaultValues?.educationLevel,
      classRoll: "",
      email: defaultValues?.email ?? "",
      studentGroup: "",
      message: "",
      pricingAcknowledged: undefined,
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      const result = await apiFetch<{
        fullName?: string;
        email?: string;
        phone?: string | null;
      }>("/api/profile");

      if (cancelled) return;
      if (!result.success || !result.data) {
        if (!isDashboard) setAuthState("guest");
        return;
      }

      setAuthState("signed-in");
      const current = getValues();
      if (!current.email?.trim() && result.data.email) {
        setValue("email", result.data.email, { shouldDirty: false });
      }
      if (!current.phone.trim() && result.data.phone) {
        setValue("phone", result.data.phone, { shouldDirty: false });
      }
    }

    void loadAccount();
    return () => {
      cancelled = true;
    };
  }, [getValues, isDashboard, setValue]);

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
  const grid = `grid grid-cols-1 gap-4 ${compact ? "" : "sm:grid-cols-2"}`;

  if (isSubmitted) {
    return <SuccessMessage showDashboardLink={!isDashboard} />;
  }

  if (authState === "checking") {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-navy/50">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  if (authState === "guest") {
    return <LoginRequired />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="font-bangla space-y-5" noValidate>
      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 ${
          isDashboard
            ? "border-amber-200/80 bg-amber-50/80"
            : "border-amber-100 bg-amber-50"
        }`}
      >
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="space-y-1.5 text-sm leading-relaxed text-amber-950/80">
          <p className="font-semibold">
            স্টাডি প্ল্যান/কাউন্সেলিং বুক করার পূর্বে নির্ধারিত সম্মানী প্রদান করতে হবে।
          </p>
          <p>
            ঢাকায় অবস্থানকারী অভিভাবকরা অনলাইন অথবা অফলাইনে এবং ঢাকার বাইরের
            অভিভাবকরা অনলাইনে আমাদের কাউন্সেলিং সেবা গ্রহণ করতে পারবেন।
          </p>
          <p>
            অনুরোধ জমা দেওয়ার পর আমাদের টিম যোগাযোগ করে সেশনের সময়সূচি ও সম্মানীর
            বিস্তারিত জানাবে। অভিভাবকের সম্মতি এবং সম্মানী প্রদানের পর অ্যাপয়েন্টমেন্ট
            নিশ্চিত করা হবে।
          </p>
        </div>
      </div>

      <div className={grid}>
        <FormField
          label="Student's Name"
          id="booking-fullName"
          error={errors.fullName?.message}
          {...register("fullName")}
          placeholder="Student's full name"
          autoComplete="off"
          className={inputShell}
        />
        <FormField
          label="Contact Number"
          id="booking-phone"
          type="tel"
          error={errors.phone?.message}
          {...register("phone")}
          placeholder="01XXXXXXXXX"
          autoComplete="tel"
          className={inputShell}
        />
      </div>

      <FormField
        label="School Name"
        id="booking-schoolName"
        error={errors.schoolName?.message}
        {...register("schoolName")}
        placeholder="e.g. Banasree Ideal School"
        autoComplete="off"
        className={inputShell}
      />

      <div className={grid}>
        <FormSelect
          label="Class"
          id="booking-educationLevel"
          error={errors.educationLevel?.message}
          {...register("educationLevel")}
          options={EDUCATION_LEVELS as unknown as string[]}
          placeholder="Select class"
          className={inputShell}
        />
        <FormField
          label="Class Roll"
          id="booking-classRoll"
          error={errors.classRoll?.message}
          {...register("classRoll")}
          placeholder="e.g. 12"
          autoComplete="off"
          className={inputShell}
        />
      </div>

      <div className={grid}>
        <FormField
          label="Email (optional)"
          id="booking-email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
          placeholder="you@example.com"
          autoComplete="email"
          className={inputShell}
        />
        <FormSelect
          label="Group (optional)"
          id="booking-studentGroup"
          error={errors.studentGroup?.message}
          {...register("studentGroup")}
          options={STUDENT_GROUPS as unknown as string[]}
          placeholder="Select group"
          className={inputShell}
        />
      </div>

      <div>
        <label
          htmlFor="booking-message"
          className="mb-1.5 block text-sm font-medium text-navy/80"
        >
          শিক্ষার্থীর সমস্যা
        </label>
        <textarea
          id="booking-message"
          rows={4}
          className={`w-full resize-none text-sm outline-none transition ${
            inputShell ??
            "rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
          }`}
          placeholder="আপনার সন্তানের পড়াশোনার সমস্যা বা যে বিষয়গুলোতে সে তুলনামূলকভাবে দুর্বল, সেগুলো সংক্ষেপে লিখুন।"
          {...register("message")}
        />
        {errors.message ? (
          <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy/8 bg-white p-4 transition hover:border-navy/15">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-accent focus:ring-accent/30"
          {...register("pricingAcknowledged")}
        />
        <span className="text-sm leading-relaxed text-navy/70">
          আমি সম্মতি প্রদান করছি যে, স্টাডি প্ল্যান/কাউন্সেলিং সেশনটি একটি পেইড সার্ভিস।
          সেশন নির্ধারণের পূর্বে ব্রড একাডেমির সংশ্লিষ্ট টিম আমার সঙ্গে যোগাযোগ করে
          সেশনের প্রযোজ্য ফি, শর্তাবলি এবং অন্যান্য প্রয়োজনীয় তথ্য অবহিত করবে।
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
            Request for Study Plan / Counselling
          </>
        )}
      </motion.button>
    </form>
  );
}

function LoginRequired() {
  // After signing in, land straight on the booking form instead of having to
  // find the button again.
  const query = `?next=${encodeURIComponent("/counselling")}`;

  return (
    <div className="font-bangla flex flex-col items-center px-2 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-btnBg/10 text-btnBg">
        <LogIn className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-navy">
        বুক করতে লগইন করুন
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy/65">
        স্টাডি প্ল্যান/কাউন্সেলিং বুক করতে আপনার অ্যাকাউন্টে লগইন করুন। অ্যাকাউন্ট না
        থাকলে নতুন অ্যাকাউন্ট তৈরি করুন — এতে আমরা আপনার সাথে যোগাযোগ করতে ও
        প্রয়োজনীয় তথ্য আদান-প্রদান করতে পারবো।
      </p>
      <div className="mt-6 flex w-full max-w-sm flex-col gap-2.5 sm:flex-row">
        <Link
          href={`/login${query}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-btnBg px-5 py-3 text-sm font-semibold text-white transition hover:bg-btnBgDark"
        >
          <LogIn className="h-4 w-4" /> Login
        </Link>
        <Link
          href={`/register${query}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-navy/12 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-navy/5"
        >
          <UserPlus className="h-4 w-4" /> Create account
        </Link>
      </div>
    </div>
  );
}

function SuccessMessage({ showDashboardLink }: { showDashboardLink: boolean }) {
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
      <p className="font-bangla mt-2 max-w-sm text-sm leading-relaxed text-navy/70">
        আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করে সেশনের সময়সূচি ও সম্মানীর বিস্তারিত
        জানাবে। আপনার ড্যাশবোর্ডের Counselling অংশে অনুরোধের অবস্থা দেখতে পারবেন।
      </p>
      {showDashboardLink ? (
        <Link
          href="/dashboard?tab=counselling"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-btnBg px-5 py-3 text-sm font-semibold text-white transition hover:bg-btnBgDark"
        >
          ড্যাশবোর্ডে অবস্থা দেখুন
        </Link>
      ) : null}
    </motion.div>
  );
}
