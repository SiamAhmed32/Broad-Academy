"use client";

import { CalendarCheck, ShieldCheck } from "lucide-react";

import BookingForm from "./BookingForm";

export default function CounsellingPageContent() {
  return (
    <section className="bg-[#f4f8fc]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="rounded-3xl border border-navy/10 bg-white p-5 shadow-[0_24px_60px_rgba(22,51,81,0.12)] sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-btnBg/10 text-btnBg">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-navy sm:text-xl">
                Request a parent counselling session
              </h1>
              <p className="mt-1 text-sm leading-6 text-navy/70">
                Class 9 to SSC. We’ll confirm availability with you before the
                session is finalised.
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                Fees confirmed before the session
              </p>
            </div>
          </div>

          <BookingForm />
        </div>
      </div>
    </section>
  );
}
